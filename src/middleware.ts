import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getRoleHome, isUserRole } from "@/lib/auth/roles";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

const isAfterAuthRoute = createRouteMatcher(["/after-auth(.*)"]);
const isEmployerRoute = createRouteMatcher(["/employer(.*)"]);
const isWorkerRoute = createRouteMatcher(["/worker(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

function getSessionRole(sessionClaims: CustomJwtSessionClaims | null) {
  const role = sessionClaims?.metadata?.role;
  return isUserRole(role) ? role : null;
}

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return;
  }

  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  if (isAfterAuthRoute(req)) {
    return;
  }

  const role = getSessionRole(sessionClaims);

  if (!role) {
    return NextResponse.redirect(new URL("/after-auth", req.url));
  }

  if (isEmployerRoute(req) && role !== "employer") {
    return NextResponse.redirect(new URL(getRoleHome(role), req.url));
  }

  if (isWorkerRoute(req) && role !== "worker") {
    return NextResponse.redirect(new URL(getRoleHome(role), req.url));
  }

  if (isAdminRoute(req) && role !== "admin") {
    return NextResponse.redirect(new URL(getRoleHome(role), req.url));
  }

  return;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
