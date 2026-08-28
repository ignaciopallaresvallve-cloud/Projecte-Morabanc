import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const LOGIN_PATH = "/admin/login";

/**
 * Protege /admin: sin sesión de Supabase, redirige al login.
 * Esto es solo la capa de UX — cada Server Action de escritura vuelve a
 * verificar la sesión (`requireUser`) porque las Server Functions son
 * alcanzables por POST directo, sin pasar por aquí.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isLoginPath = request.nextUrl.pathname === LOGIN_PATH;

  if (!supabaseUrl || !supabaseAnonKey) {
    return isLoginPath
      ? response
      : NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  if (!user && !isLoginPath) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  if (user && isLoginPath) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
