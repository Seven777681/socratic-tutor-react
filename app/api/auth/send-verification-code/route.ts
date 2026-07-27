import { NextResponse } from "next/server";
import type { SendVerificationCodeRequest } from "@/types/auth";
import { isValidUsername } from "@/lib/auth/username-utils";
import {
  getMockVerificationCode,
  saveVerificationCode,
} from "@/lib/server/mock-auth-store";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<SendVerificationCodeRequest>;
  const username = body.username?.trim() ?? "";

  if (!username) {
    return NextResponse.json(
      { success: false, message: "Please enter your username." },
      { status: 400 },
    );
  }

  if (!isValidUsername(username)) {
    return NextResponse.json(
      {
        success: false,
        message: "Username must be a valid email address or phone number.",
      },
      { status: 400 },
    );
  }

  saveVerificationCode(username);

  if (process.env.NODE_ENV === "development") {
    console.info(
      `Mock verification code for development: ${getMockVerificationCode()}`,
    );
  }

  return NextResponse.json({
    success: true,
    message: "Verification code sent.",
  });
}
