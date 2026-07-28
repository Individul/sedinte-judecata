import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // 303 forces the browser to GET /login after the POST.
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
