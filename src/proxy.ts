import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "LOGBOOK_SESSION";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login" || request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!api|logbook-log|_next/static|_next/image|favicon.ico).*)"],
};
