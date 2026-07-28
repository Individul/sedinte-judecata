"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    { error: null },
  );

  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-blue-600 text-lg font-bold text-white">
            SJ
          </span>
          <h1 className="text-xl font-semibold text-slate-900">
            Evidența ședințelor de judecată
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Autentifică-te pentru a continua
          </p>
        </div>

        <form
          action={formAction}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-1.5">
            <Label htmlFor="username">Nume utilizator</Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              required
              autoFocus
              placeholder="ex: ipopescu"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Parolă</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
          </div>

          {state.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Se autentifică…" : "Autentificare"}
          </Button>
        </form>
      </div>
    </div>
  );
}
