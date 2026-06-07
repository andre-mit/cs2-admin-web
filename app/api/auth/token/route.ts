import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import jwt from "jsonwebtoken";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.steamId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET is not defined in environment variables.");
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    const payload = {
      steamId: session.user.steamId,
      name: session.user.name,
      // Default to 1 day expiration
    };

    const token = jwt.sign(payload, secret, { expiresIn: "1d" });

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error generating token:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
