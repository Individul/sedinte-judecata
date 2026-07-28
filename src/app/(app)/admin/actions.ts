"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import type { Role } from "@/lib/types";

export interface AdminState {
  ok: boolean;
  message: string;
}

const ROLES: Role[] = ["admin", "operator", "viewer"];

// Supabase requires an email per user; for username-only accounts we derive a
// synthetic internal address. Login resolves the username back to this email.
const USERNAME_EMAIL_DOMAIN = "sedinte-judecata.local";

/** Returns the current user if they are an admin, otherwise null. */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "admin" ? user : null;
}

export async function createUser(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const admin = await requireAdmin();
  if (!admin) {
    return { ok: false, message: "Doar administratorii pot crea utilizatori." };
  }

  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "viewer") as Role;

  if (!username || !password) {
    return {
      ok: false,
      message: "Numele de utilizator și parola sunt obligatorii.",
    };
  }
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
    return {
      ok: false,
      message:
        "Nume de utilizator invalid (litere mici, cifre, . _ - ; minim 3 caractere).",
    };
  }
  if (password.length < 8) {
    return { ok: false, message: "Parola trebuie să aibă minim 8 caractere." };
  }
  if (!ROLES.includes(role)) {
    return { ok: false, message: "Rol invalid." };
  }

  const adminClient = createAdminClient();

  // Refuză username-urile deja folosite (verificare explicită, plus indexul unic).
  const { data: existing } = await adminClient
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existing) {
    return {
      ok: false,
      message: "Acest nume de utilizator este deja folosit.",
    };
  }

  const email = `${username}@${USERNAME_EMAIL_DOMAIN}`;
  const { error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName || username, role, username },
  });

  if (error) {
    return { ok: false, message: `Eroare: ${error.message}` };
  }

  await logAudit({
    actorId: admin.id,
    action: "user.create",
    entity: "user",
    entityLabel: username,
    details: { role },
  });

  revalidatePath("/admin");
  return { ok: true, message: `Utilizatorul „${username}" a fost creat.` };
}

export async function setUserRole(
  userId: string,
  role: Role,
): Promise<AdminState> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, message: "Neautorizat." };
  if (!ROLES.includes(role)) return { ok: false, message: "Rol invalid." };
  if (userId === admin.id && role !== "admin") {
    return {
      ok: false,
      message: "Nu îți poți retrage propriul rol de administrator.",
    };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) return { ok: false, message: `Eroare: ${error.message}` };

  const { data: target } = await adminClient
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();
  await logAudit({
    actorId: admin.id,
    action: "user.role_change",
    entity: "user",
    entityLabel: target?.username ?? userId,
    details: { role },
  });

  revalidatePath("/admin");
  return { ok: true, message: "Rol actualizat." };
}

export async function updateUser(
  userId: string,
  data: { fullName: string; username: string; password: string },
): Promise<AdminState> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, message: "Neautorizat." };

  const username = data.username.trim().toLowerCase();
  const fullName = data.fullName.trim();
  const password = data.password;

  if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
    return {
      ok: false,
      message:
        "Nume de utilizator invalid (litere mici, cifre, . _ - ; minim 3 caractere).",
    };
  }
  if (password && password.length < 8) {
    return { ok: false, message: "Parola trebuie să aibă minim 8 caractere." };
  }

  const adminClient = createAdminClient();

  // Username-ul trebuie să rămână unic (ignoră propriul rând).
  const { data: clash } = await adminClient
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", userId)
    .maybeSingle();
  if (clash) {
    return { ok: false, message: "Acest nume de utilizator este deja folosit." };
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({ full_name: fullName || username, username })
    .eq("id", userId);
  if (profileError) {
    return { ok: false, message: `Eroare: ${profileError.message}` };
  }

  const attrs: { user_metadata: Record<string, unknown>; password?: string } = {
    user_metadata: { full_name: fullName || username, username },
  };
  if (password) attrs.password = password;

  const { error: authError } = await adminClient.auth.admin.updateUserById(
    userId,
    attrs,
  );
  if (authError) {
    return { ok: false, message: `Eroare: ${authError.message}` };
  }

  await logAudit({
    actorId: admin.id,
    action: "user.update",
    entity: "user",
    entityLabel: username,
    details: { passwordChanged: !!password },
  });

  revalidatePath("/admin");
  return {
    ok: true,
    message: password
      ? "Utilizator actualizat, parolă schimbată."
      : "Utilizator actualizat.",
  };
}

export async function deleteUser(userId: string): Promise<AdminState> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, message: "Neautorizat." };
  if (userId === admin.id) {
    return { ok: false, message: "Nu îți poți șterge propriul cont." };
  }

  const adminClient = createAdminClient();
  const { data: target } = await adminClient
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) return { ok: false, message: `Eroare: ${error.message}` };

  await logAudit({
    actorId: admin.id,
    action: "user.delete",
    entity: "user",
    entityLabel: target?.username ?? userId,
  });

  revalidatePath("/admin");
  return { ok: true, message: "Utilizator șters." };
}
