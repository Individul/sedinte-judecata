"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  revalidatePath("/admin");
  return { ok: true, message: "Rol actualizat." };
}
