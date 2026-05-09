import { auth0 } from "./lib/auth0.js";

export async function proxy(request) {
  return auth0.middleware(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};