import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client({
  domain: "dev-eedmka678fydxtgm.us.auth0.com",
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret: process.env.AUTH0_SECRET,
  appBaseUrl: "http://localhost:3000",
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,  // ← hardcode it temporarily
    scope: "openid profile email offline_access",  // ← add offline_access
  }
});