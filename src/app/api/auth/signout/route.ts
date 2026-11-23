// Forced sign-out used by server redirects (deactivated account, idle timeout), where a
// Server Component can't clear cookies itself. Normal sign-out is the signOut action.
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const REASONS = new Set(["inactive", "idle"]);

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: "local" });
  const reason = request.nextUrl.searchParams.get("reason");
  const url = new URL("/admin/login", request.url);
  if (reason && REASONS.has(reason)) url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}
