import { createAdminClient } from "@/lib/supabase/admin";

export type AuditAction =
  | "session.create"
  | "session.update"
  | "user.create"
  | "user.update"
  | "user.delete"
  | "user.role_change";

/**
 * Write one audit entry. Runs server-side with the service_role key (bypasses
 * RLS). Never throws — a failed log must not break the underlying action.
 */
export async function logAudit(entry: {
  actorId: string;
  action: AuditAction;
  entity: "session" | "user";
  entityLabel?: string | null;
  details?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: prof } = await admin
      .from("profiles")
      .select("username")
      .eq("id", entry.actorId)
      .maybeSingle();

    await admin.from("audit_log").insert({
      actor_id: entry.actorId,
      actor_username: prof?.username ?? null,
      action: entry.action,
      entity: entry.entity,
      entity_label: entry.entityLabel ?? null,
      details: entry.details ?? null,
    });
  } catch {
    // Logarea nu trebuie să blocheze acțiunea principală.
  }
}
