import { createClient } from "@/lib/supabase/server";
import { getSessionByDate } from "@/lib/data";
import { toISODate } from "@/lib/periods";
import type { Role } from "@/lib/types";
import { DailyForm } from "./daily-form";

export const dynamic = "force-dynamic";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export default async function IntroducerePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const sessionDate = date && ISO.test(date) ? date : toISODate(new Date());

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();
  const role = (profile?.role ?? "viewer") as Role;

  if (role === "viewer") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
        Nu ai permisiunea de a introduce date. Rolul tău permite doar
        vizualizarea rapoartelor. Contactează un administrator dacă ai nevoie de
        acces de operator.
      </div>
    );
  }

  const existing = await getSessionByDate(sessionDate);

  return <DailyForm key={sessionDate} date={sessionDate} initial={existing} />;
}
