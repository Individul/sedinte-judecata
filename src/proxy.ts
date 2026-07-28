import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16 renamed `middleware` to `proxy` (nodejs runtime).
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on every path except static assets and image files so the auth
     * session cookie is refreshed while the user browses.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
