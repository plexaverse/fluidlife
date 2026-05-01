import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const DIST_COOKIE = "dist_session";

export const config = {
  matcher: ["/distributor/:path*"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Login page is always accessible.
  if (pathname === "/distributor/login" || pathname.startsWith("/distributor/login/")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(DIST_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/distributor/login", req.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.USER_ACCESS_SECRET ?? "");
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    if ((payload as any).role !== "DISTRIBUTOR") throw new Error("wrong role");
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL("/distributor/login", req.url));
    res.cookies.set(DIST_COOKIE, "", { maxAge: 0, path: "/distributor" });
    return res;
  }
}
