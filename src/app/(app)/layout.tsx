import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/app-nav";
import { ROLE_LABELS, type Role } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "viewer") as Role;
  const name = profile?.full_name ?? user.email ?? "Utilizator";

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 font-semibold text-slate-900">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-blue-600 text-xs font-bold text-white">
                SJ
              </span>
              <span className="hidden sm:inline">Evidența ședințelor</span>
            </span>
            <AppNav role={role} />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium leading-tight text-slate-800">
                {name}
              </div>
              <div className="text-xs leading-tight text-slate-500">
                {ROLE_LABELS[role]}
              </div>
            </div>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50"
              >
                Ieșire
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
