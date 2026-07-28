import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateTimeRo } from "@/lib/format";
import { formatDateShortRo } from "@/lib/periods";
import { ROLE_LABELS, type Role } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const ACTION_LABEL: Record<string, string> = {
  "session.create": "A introdus date",
  "session.update": "A modificat date",
  "user.create": "A creat utilizator",
  "user.update": "A editat utilizator",
  "user.delete": "A șters utilizator",
  "user.role_change": "A schimbat rolul",
};

const ACTION_TONE: Record<string, "blue" | "green" | "amber" | "slate" | "red"> =
  {
    "session.create": "green",
    "session.update": "blue",
    "user.create": "green",
    "user.update": "blue",
    "user.delete": "red",
    "user.role_change": "amber",
  };

interface AuditRow {
  id: string;
  created_at: string;
  actor_username: string | null;
  action: string;
  entity: string;
  entity_label: string | null;
  details: Record<string, unknown> | null;
}

function detailText(r: AuditRow): string {
  if (r.entity === "session") {
    return r.entity_label ? `Ședințe din ${formatDateShortRo(r.entity_label)}` : "";
  }
  if (r.action === "user.role_change") {
    const role = r.details?.role;
    return role
      ? `${r.entity_label ?? ""} → ${ROLE_LABELS[String(role) as Role] ?? String(role)}`
      : (r.entity_label ?? "");
  }
  return r.entity_label ?? "";
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();
  if ((me?.role as Role) !== "admin") redirect("/");

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let rows: AuditRow[] = [];
  let count = 0;
  let tableMissing = false;
  try {
    const { data, count: c, error } = await supabase
      .from("audit_log")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) throw error;
    rows = (data as AuditRow[]) ?? [];
    count = c ?? 0;
  } catch {
    tableMissing = true;
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Jurnal de audit</h1>
        <p className="text-sm text-slate-500">
          Istoricul acțiunilor: cine, ce și când.
        </p>
      </div>

      {tableMissing ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Tabelul de audit nu există încă. Rulează migrarea{" "}
          <code className="rounded bg-amber-100 px-1">0003_audit_log.sql</code> în
          Supabase → SQL Editor.
        </div>
      ) : (
        <Card>
          <CardContent className="pt-5">
            {rows.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                Nu există încă înregistrări.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                      <th className="py-2 pr-3 font-medium">Data și ora</th>
                      <th className="py-2 pr-3 font-medium">Utilizator</th>
                      <th className="py-2 pr-3 font-medium">Acțiune</th>
                      <th className="py-2 font-medium">Detaliu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-2 pr-3 whitespace-nowrap text-slate-500">
                          {formatDateTimeRo(r.created_at)}
                        </td>
                        <td className="py-2 pr-3 font-medium text-slate-800">
                          {r.actor_username ?? "—"}
                        </td>
                        <td className="py-2 pr-3">
                          <Badge tone={ACTION_TONE[r.action] ?? "slate"}>
                            {ACTION_LABEL[r.action] ?? r.action}
                          </Badge>
                        </td>
                        <td className="py-2 text-slate-600">{detailText(r)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!tableMissing && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link
              href={`/audit?page=${page - 1}`}
              className="text-blue-600 hover:underline"
            >
              ← Anterioare
            </Link>
          ) : (
            <span className="text-slate-300">← Anterioare</span>
          )}
          <span className="text-slate-500">
            Pagina {page} din {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/audit?page=${page + 1}`}
              className="text-blue-600 hover:underline"
            >
              Următoare →
            </Link>
          ) : (
            <span className="text-slate-300">Următoare →</span>
          )}
        </div>
      )}
    </div>
  );
}
