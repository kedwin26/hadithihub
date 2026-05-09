import { redirect } from "next/navigation";

export async function GET() {
  redirect(`https://${process.env.AUTH0_DOMAIN}/authorize?client_id=${process.env.AUTH0_CLIENT_ID}&redirect_uri=${process.env.AUTH0_BASE_URL}/api/auth/callback&response_type=code&scope=openid profile email&audience=${process.env.AUTH0_AUDIENCE}`);
}