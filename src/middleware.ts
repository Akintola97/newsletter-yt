// src/middleware.ts
import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";

export default function middleware(req) {
  return withAuth(req, {
    loginPage: "/api/auth/login",
    isReturnToCurrentPage: true,
    isAuthorized: ({ token }) => {
      return !!token;
    },
  });
}

export const config = {
  matcher: [ "/dashboard/:path*", "/api/preferences/:path*"],
};
