"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import type { DailyInput } from "@/lib/types";

export interface SaveState {
  ok: boolean;
  message: string;
}

const FIELDS: (keyof DailyInput)[] = [
  "tc_prezenti",
  "tc_amanate",
  "ij_prezenti",
  "ij_amanate",
];

function toInt(v: FormDataEntryValue | null): number {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export async function saveDailySession(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Sesiune expirată. Autentifică-te din nou." };
  }

  // Authorization: only operator + admin may write.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || !["operator", "admin"].includes(profile.role)) {
    return { ok: false, message: "Nu ai permisiunea de a introduce date." };
  }

  const date = String(formData.get("session_date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, message: "Dată invalidă." };
  }

  const values = Object.fromEntries(
    FIELDS.map((f) => [f, toInt(formData.get(f))]),
  ) as unknown as DailyInput;
  const note = String(formData.get("note") ?? "").trim() || null;

  const { data: existing } = await supabase
    .from("daily_sessions")
    .select("id")
    .eq("session_date", date)
    .maybeSingle();

  const payload = { ...values, note, updated_by: user.id };

  const { error } = existing
    ? await supabase.from("daily_sessions").update(payload).eq("id", existing.id)
    : await supabase
        .from("daily_sessions")
        .insert({ session_date: date, ...payload, created_by: user.id });

  if (error) {
    return { ok: false, message: `Eroare la salvare: ${error.message}` };
  }

  await logAudit({
    actorId: user.id,
    action: existing ? "session.update" : "session.create",
    entity: "session",
    entityLabel: date,
    details: values as unknown as Record<string, unknown>,
  });

  revalidatePath("/introducere");
  revalidatePath("/");
  revalidatePath("/rapoarte");

  return {
    ok: true,
    message: existing
      ? "Datele au fost actualizate."
      : "Datele au fost salvate.",
  };
}
