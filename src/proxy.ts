// proxy.ts (Next 16's replacement for middleware). Per docs/ARCHITECTURE.md §9 it does
// ONLY two things: refresh the Supabase session cookie, and send signed-out visitors
// of /admin to the login page. No DB queries. Real authorisation happens in
// requireStaff() (layouts + every Server Action) and in RLS.
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isPublicAdminPath } from "@/lib/auth/gate";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
        },
      },
    },
  );

  // Verifies the JWT and refreshes an expiring session. Don't put code between
  // createServerClient and this call.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  const { pathname, search } = request.nextUrl;
  if (!signedIn && pathname.startsWith("/admin") && !isPublicAdminPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    url.searchParams.set("next", pathname + search);
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}

export const config = {
  // Only routes that use the staff session. The public site never touches auth cookies.
  matcher: ["/admin/:path*", "/api/media/:path*", "/api/preview"],
};
