import { createHash, randomUUID } from "crypto";
import type { AuthUser, RegisterRequest } from "@/types/auth";
import {
  getUsernameType,
  normalizeUsername,
} from "@/lib/auth/username-utils";

const mockVerificationCode = "123456";
const verificationTtlMs = 10 * 60 * 1000;

interface MockVerificationCode {
  username: string;
  codeHash: string;
  expiresAt: string;
  createdAt: string;
}

interface MockRegisteredUser extends AuthUser {
  passwordHash: string;
  createdAt: string;
}

interface MockAuthStore {
  users: MockRegisteredUser[];
  verificationCodes: MockVerificationCode[];
}

const globalStore = globalThis as typeof globalThis & {
  socraticMockAuthStore?: MockAuthStore;
};

const store =
  globalStore.socraticMockAuthStore ??
  {
    users: [],
    verificationCodes: [],
  };

globalStore.socraticMockAuthStore = store;

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function getMockVerificationCode() {
  return mockVerificationCode;
}

export function findUserByUsername(username: string) {
  const normalizedUsername = normalizeUsername(username);
  return store.users.find((user) => user.username === normalizedUsername);
}

export function saveVerificationCode(username: string) {
  const normalizedUsername = normalizeUsername(username);
  const now = new Date();
  const nextCode: MockVerificationCode = {
    username: normalizedUsername,
    codeHash: hashValue(mockVerificationCode),
    expiresAt: new Date(now.getTime() + verificationTtlMs).toISOString(),
    createdAt: now.toISOString(),
  };

  store.verificationCodes = [
    ...store.verificationCodes.filter((code) => code.username !== normalizedUsername),
    nextCode,
  ];
}

export function validateVerificationCode(username: string, code: string) {
  const normalizedUsername = normalizeUsername(username);
  const storedCode = store.verificationCodes.find(
    (candidate) => candidate.username === normalizedUsername,
  );

  if (!storedCode) {
    return "Invalid verification code.";
  }

  if (new Date(storedCode.expiresAt).getTime() < Date.now()) {
    return "Verification code has expired. Please request a new one.";
  }

  if (storedCode.codeHash !== hashValue(code.trim())) {
    return "Invalid verification code.";
  }

  return undefined;
}

export function registerMockUser(values: RegisterRequest) {
  const normalizedUsername = normalizeUsername(values.username);
  const user: MockRegisteredUser = {
    id: randomUUID(),
    username: normalizedUsername,
    usernameType: getUsernameType(normalizedUsername),
    displayName: values.displayName.trim(),
    passwordHash: hashValue(values.password),
    role: "student",
    createdAt: new Date().toISOString(),
  };

  store.users.push(user);
  store.verificationCodes = store.verificationCodes.filter(
    (code) => code.username !== normalizedUsername,
  );

  return toAuthUser(user);
}

export function verifyUserPassword(username: string, password: string) {
  const user = findUserByUsername(username);

  if (!user || user.passwordHash !== hashValue(password)) {
    return undefined;
  }

  return toAuthUser(user);
}

function toAuthUser(user: MockRegisteredUser): AuthUser {
  return {
    id: user.id,
    username: user.username,
    usernameType: user.usernameType,
    displayName: user.displayName,
    role: user.role,
  };
}
