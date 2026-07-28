import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/lib/types";
import { AdminPanel, type UserRow } from "./admin-client";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (me?.role !== "admin") redirect("/");

  let users: UserRow[] = [];
  let listError: string | null = null;

  try {
    const admin = createAdminClient();
    const [{ data: list, error: listErr }, { data: profiles }] =
      await Promise.all([
        admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
        admin.from("profiles").select("id, role, full_name"),
      ]);

    if (listErr) throw listErr;

    const byId = new Map(
      (profiles ?? []).map((p) => [p.id as string, p]),
    );

    users = (list?.users ?? [])
      .map((u): UserRow => {
        const p = byId.get(u.id);
        return {
          id: u.id,
          email: u.email ?? "",
          fullName:
            (p?.full_name as string) ??
            (u.user_metadata?.full_name as string) ??
            "",
          role: ((p?.role as Role) ?? "viewer") as Role,
        };
      })
      .sort((a, b) => a.email.localeCompare(b.email));
  } catch {
    listError =
      "Nu s-au putut încărca utilizatorii. Verifică variabila SUPABASE_SERVICE_ROLE_KEY.";
  }

  return (
    <AdminPanel users={users} currentUserId={user!.id} listError={listError} />
  );
}
