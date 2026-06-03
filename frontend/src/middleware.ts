import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/admission", "/admin/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const hasAdminSession = request.cookies.has("admin_session");

  if (!isPublicPath && !hasAdminSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/admin/login" && hasAdminSession) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/";
    adminUrl.search = "";
    return NextResponse.redirect(adminUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
