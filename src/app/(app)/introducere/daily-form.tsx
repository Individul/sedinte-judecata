"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { computeIndicators } from "@/lib/calc";
import { formatNumber } from "@/lib/format";
import { formatDateRo } from "@/lib/periods";
import { saveDailySession, type SaveState } from "./actions";
import type { DailyInput, DailySession } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatTile } from "@/components/stat-tile";

type Raw = Record<keyof DailyInput, string>;

const EMPTY_RAW: Raw = {
  tc_prezenti: "",
  tc_examinati_lipsa: "",
  tc_amanate: "",
  ij_prezenti: "",
  ij_examinati_lipsa: "",
  ij_amanate: "",
};

function toRaw(initial: DailySession | null): Raw {
  if (!initial) return { ...EMPTY_RAW };
  return {
    tc_prezenti: String(initial.tc_prezenti),
    tc_examinati_lipsa: String(initial.tc_examinati_lipsa),
    tc_amanate: String(initial.tc_amanate),
    ij_prezenti: String(initial.ij_prezenti),
    ij_examinati_lipsa: String(initial.ij_examinati_lipsa),
    ij_amanate: String(initial.ij_amanate),
  };
}

const num = (s: string) => Math.max(0, Math.floor(Number(s) || 0));

export function DailyForm({
  date,
  initial,
}: {
  date: string;
  initial: DailySession | null;
}) {
  const router = useRouter();
  const [raw, setRaw] = useState<Raw>(() => toRaw(initial));
  const [note, setNote] = useState(initial?.note ?? "");
  const [state, formAction, pending] = useActionState<SaveState, FormData>(
    saveDailySession,
    { ok: false, message: "" },
  );

  const input: DailyInput = {
    tc_prezenti: num(raw.tc_prezenti),
    tc_examinati_lipsa: num(raw.tc_examinati_lipsa),
    tc_amanate: num(raw.tc_amanate),
    ij_prezenti: num(raw.ij_prezenti),
    ij_examinati_lipsa: num(raw.ij_examinati_lipsa),
    ij_amanate: num(raw.ij_amanate),
  };
  const ind = computeIndicators(input);

  const set = (k: keyof DailyInput, v: string) =>
    setRaw((p) => ({ ...p, [k]: v.replace(/[^\d]/g, "") }));

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="session_date" value={date} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Introducere date
          </h1>
          <p className="text-sm text-slate-500">{formatDateRo(date)}</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date">Data ședințelor</Label>
          <Input
            id="date"
            type="date"
            className="w-48"
            defaultValue={date}
            onChange={(e) => {
              if (e.target.value)
                router.push(`/introducere?date=${e.target.value}`);
            }}
          />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <CategoryCard
          title="Teleconferință"
          prezentiLabel="Prezenți"
          raw={raw}
          set={set}
          keys={["tc_prezenti", "tc_examinati_lipsa", "tc_amanate"]}
          petrecute={ind.tcPetrecute}
          total={ind.tcTotal}
        />
        <CategoryCard
          title="Instanța de judecată"
          prezentiLabel="Prezenți în instanță"
          raw={raw}
          set={set}
          keys={["ij_prezenti", "ij_examinati_lipsa", "ij_amanate"]}
          petrecute={ind.ijPetrecute}
          total={ind.ijTotal}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total general" value={ind.total} tone="blue" />
        <StatTile label="Petrecute" value={ind.petrecute} tone="green" />
        <StatTile label="Amânate" value={ind.amanate} tone="amber" />
        <StatTile
          label="La sediul judecătoriei"
          value={ind.laSediu}
          tone="slate"
          hint="Instanța de judecată"
        />
      </div>

      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="space-y-1.5">
            <Label htmlFor="note">Observații (opțional)</Label>
            <Textarea
              id="note"
              name="note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note interne despre ziua respectivă…"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending
                ? "Se salvează…"
                : initial
                  ? "Actualizează"
                  : "Salvează"}
            </Button>
            {state.message && (
              <span
                className={
                  state.ok
                    ? "text-sm font-medium text-emerald-600"
                    : "text-sm font-medium text-red-600"
                }
              >
                {state.message}
              </span>
            )}
            {initial && !state.message && (
              <span className="text-sm text-slate-400">
                Există deja date pentru această zi — le poți edita.
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

function CategoryCard({
  title,
  prezentiLabel,
  raw,
  set,
  keys,
  petrecute,
  total,
}: {
  title: string;
  prezentiLabel: string;
  raw: Raw;
  set: (k: keyof DailyInput, v: string) => void;
  keys: [keyof DailyInput, keyof DailyInput, keyof DailyInput];
  petrecute: number;
  total: number;
}) {
  const [kPrez, kExam, kAman] = keys;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-slate-900">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Field label={prezentiLabel} name={kPrez} value={raw[kPrez]} onChange={set} />
        <Field
          label="Examinați în lipsa lor"
          name={kExam}
          value={raw[kExam]}
          onChange={set}
        />
        <Field
          label="Amânate ședințe"
          name={kAman}
          value={raw[kAman]}
          onChange={set}
        />
        <div className="mt-1 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
          <span className="text-slate-500">
            Petrecute{" "}
            <b className="ml-1 text-slate-700 tabular-nums">
              {formatNumber(petrecute)}
            </b>
          </span>
          <span className="text-slate-500">
            Total ședințe{" "}
            <b className="ml-1 text-blue-700 tabular-nums">
              {formatNumber(total)}
            </b>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: keyof DailyInput;
  value: string;
  onChange: (k: keyof DailyInput, v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor={name} className="text-slate-600">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        inputMode="numeric"
        className="w-28 text-right tabular-nums"
        placeholder="0"
      />
    </div>
  );
}
