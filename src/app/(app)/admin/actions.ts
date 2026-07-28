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

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "viewer") as Role;

  if (!email || !password) {
    return { ok: false, message: "Email și parolă sunt obligatorii." };
  }
  if (password.length < 8) {
    return {
      ok: false,
      message: "Parola trebuie să aibă minim 8 caractere.",
    };
  }
  if (!ROLES.includes(role)) {
    return { ok: false, message: "Rol invalid." };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName || email, role },
  });

  if (error) {
    return { ok: false, message: `Eroare: ${error.message}` };
  }

  revalidatePath("/admin");
  return { ok: true, message: `Utilizatorul ${email} a fost creat.` };
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
