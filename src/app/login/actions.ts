"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface LoginState {
  error: string | null;
}

const GENERIC = "Nume de utilizator sau parolă incorecte.";

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Completează numele de utilizator și parola." };
  }

  // Resolve username -> account email using the privileged (server-only) client.
  let email: string | undefined;
  try {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (profile?.id) {
      const { data } = await admin.auth.admin.getUserById(profile.id);
      email = data.user?.email ?? undefined;
    }
  } catch {
    return { error: "Eroare de server. Încearcă din nou." };
  }

  // Same message whether the username is unknown or the password is wrong.
  if (!email) return { error: GENERIC };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: GENERIC };

  revalidatePath("/", "layout");
  redirect("/");
}
