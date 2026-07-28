export type Role = "admin" | "operator" | "viewer";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  operator: "Operator",
  viewer: "Vizualizator",
};

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  role: Role;
  created_at: string;
}

/** The four numbers an operator types in for a given day. */
export interface DailyInput {
  tc_prezenti: number;
  tc_amanate: number;
  ij_prezenti: number;
  ij_amanate: number;
}

/** A full row from `daily_sessions`, including Postgres-computed totals. */
export interface DailySession extends DailyInput {
  id: string;
  session_date: string; // ISO date, YYYY-MM-DD
  note: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  tc_total: number;
  ij_total: number;
  total_general: number;
}

export const PERIODS = [
  "zi",
  "saptamana",
  "luna",
  "trimestru",
  "semestru",
  "an",
] as const;

export type Period = (typeof PERIODS)[number];

export const PERIOD_LABELS: Record<Period, string> = {
  zi: "Zi",
  saptamana: "Săptămână",
  luna: "Lună",
  trimestru: "Trimestru",
  semestru: "Semestru",
  an: "An",
};
