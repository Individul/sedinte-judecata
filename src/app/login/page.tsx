"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Email sau parolă incorecte.");
      setLoading(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

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
          onSubmit={onSubmit}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nume@exemplu.md"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Parolă</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Se autentifică…" : "Autentificare"}
          </Button>
        </form>
      </div>
    </div>
  );
}
