"use client";

import { useActionState, useState, useTransition } from "react";
import { createUser, setUserRole, type AdminState } from "./actions";
import type { Role } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface UserRow {
  id: string;
  username: string;
  fullName: string;
  role: Role;
}

export function AdminPanel({
  users,
  currentUserId,
  listError,
}: {
  users: UserRow[];
  currentUserId: string;
  listError?: string | null;
}) {
  const [state, formAction, pending] = useActionState<AdminState, FormData>(
    createUser,
    { ok: false, message: "" },
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          Administrare utilizatori
        </h1>
        <p className="text-sm text-slate-500">
          Creează conturi și atribuie roluri.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Utilizator nou</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Nume complet</Label>
                <Input id="full_name" name="full_name" placeholder="Ion Popescu" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="username">Nume utilizator</Label>
                <Input
                  id="username"
                  name="username"
                  required
                  placeholder="ex: ipopescu"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Parolă temporară</Label>
                <Input
                  id="password"
                  name="password"
                  type="text"
                  required
                  placeholder="min. 8 caractere"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role">Rol</Label>
                <Select id="role" name="role" defaultValue="operator">
                  <option value="admin">Administrator</option>
                  <option value="operator">Operator</option>
                  <option value="viewer">Vizualizator</option>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Se creează…" : "Creează utilizator"}
              </Button>
              {state.message && (
                <p
                  className={
                    state.ok
                      ? "text-sm font-medium text-emerald-600"
                      : "text-sm font-medium text-red-600"
                  }
                >
                  {state.message}
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Utilizatori ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {listError ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {listError}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                      <th className="py-2 pr-3 font-medium">Utilizator</th>
                      <th className="py-2 pr-3 font-medium">Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-2 pr-3">
                          <div className="font-medium text-slate-800">
                            {u.fullName || "—"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {u.username}
                          </div>
                        </td>
                        <td className="py-2 pr-3">
                          <RoleSelect
                            userId={u.id}
                            role={u.role}
                            isSelf={u.id === currentUserId}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RoleSelect({
  userId,
  role,
  isSelf,
}: {
  userId: string;
  role: Role;
  isSelf: boolean;
}) {
  const [pending, start] = useTransition();
  const [current, setCurrent] = useState<Role>(role);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <Select
        className="w-40"
        value={current}
        disabled={isSelf || pending}
        onChange={(e) => {
          const next = e.target.value as Role;
          setCurrent(next);
          setError(null);
          start(async () => {
            const res = await setUserRole(userId, next);
            if (!res.ok) {
              setError(res.message);
              setCurrent(role);
            }
          });
        }}
      >
        <option value="admin">Administrator</option>
        <option value="operator">Operator</option>
        <option value="viewer">Vizualizator</option>
      </Select>
      {isSelf && <span className="text-xs text-slate-400">(tu)</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
