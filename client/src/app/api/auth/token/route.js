import { auth0 } from "../../../../lib/auth0";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const session = await auth0.getSession(req);
    if (!session) {
      return NextResponse.json({ accessToken: null }, { status: 200 });
    }
    const accessToken = session.tokenSet?.accessToken;
    return NextResponse.json({ accessToken });
  } catch (err) {
    console.log("SESSION ERROR:", err.message);
    return NextResponse.json({ accessToken: null }, { status: 200 });
  }
}