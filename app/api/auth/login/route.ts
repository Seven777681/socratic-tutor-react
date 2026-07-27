import { NextResponse } from "next/server";
import type { LoginRequest } from "@/types/auth";
import { normalizeUsername } from "@/lib/auth/username-utils";
import { verifyUserPassword } from "@/lib/server/mock-auth-store";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<LoginRequest>;
  const username = normalizeUsername(body.username ?? "");
  const password = body.password ?? "";

  if (!username || !password) {
    return NextResponse.json(
      {
        success: false,
        message: "Incorrect username or password. Please try again.",
      },
      { status: 401 },
    );
  }

  const user = verifyUserPassword(username, password);

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: "Incorrect username or password. Please try again.",
      },
      { status: 401 },
    );
  }

  return NextResponse.json({
    success: true,
    message: "Signed in.",
    user,
    token: `mock-auth-token-${user.id}`,
  });
}
