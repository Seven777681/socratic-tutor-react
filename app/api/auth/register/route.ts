import { NextResponse } from "next/server";
import type { RegisterRequest } from "@/types/auth";
import { isValidUsername } from "@/lib/auth/username-utils";
import {
  findUserByUsername,
  registerMockUser,
  validateVerificationCode,
} from "@/lib/server/mock-auth-store";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<RegisterRequest>;
  const username = body.username?.trim() ?? "";
  const verificationCode = body.verificationCode?.trim() ?? "";
  const displayName = body.displayName?.trim() ?? "";
  const password = body.password ?? "";
  const confirmPassword = body.confirmPassword ?? "";

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

  if (!verificationCode) {
    return NextResponse.json(
      { success: false, message: "Please enter the verification code." },
      { status: 400 },
    );
  }

  const codeError = validateVerificationCode(username, verificationCode);

  if (codeError) {
    return NextResponse.json(
      { success: false, message: codeError },
      { status: 400 },
    );
  }

  if (!displayName) {
    return NextResponse.json(
      { success: false, message: "Please enter your display name." },
      { status: 400 },
    );
  }

  if (displayName.length < 2) {
    return NextResponse.json(
      { success: false, message: "Display name must be at least 2 characters." },
      { status: 400 },
    );
  }

  if (!password || password.length < 6) {
    return NextResponse.json(
      { success: false, message: "Password must be at least 6 characters." },
      { status: 400 },
    );
  }

  if (!confirmPassword || confirmPassword !== password) {
    return NextResponse.json(
      { success: false, message: "Passwords do not match." },
      { status: 400 },
    );
  }

  if (findUserByUsername(username)) {
    return NextResponse.json(
      { success: false, message: "This username is already registered." },
      { status: 409 },
    );
  }

  const user = registerMockUser({
    username,
    verificationCode,
    displayName,
    password,
    confirmPassword,
  });

  return NextResponse.json({
    success: true,
    message: "Account created.",
    user,
    token: `mock-auth-token-${user.id}`,
  });
}
