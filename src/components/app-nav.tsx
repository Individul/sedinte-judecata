"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import type { Role } from "@/lib/types";

const LINKS: { href: string; label: string; roles: Role[] }[] = [
  { href: "/", label: "Panou", roles: ["admin", "operator", "viewer"] },
  { href: "/calendar", label: "Calendar", roles: ["admin", "operator", "viewer"] },
  { href: "/introducere", label: "Introducere", roles: ["admin", "operator"] },
  { href: "/rapoarte", label: "Rapoarte", roles: ["admin", "operator", "viewer"] },
  { href: "/admin", label: "Administrare", roles: ["admin"] },
  { href: "/audit", label: "Audit", roles: ["admin"] },
];

export function AppNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const visible = LINKS.filter((l) => l.roles.includes(role));

  return (
    <nav className="flex items-center gap-1">
      {visible.map((l) => {
        const active =
          l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
