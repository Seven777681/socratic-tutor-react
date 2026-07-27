import type { UsernameType } from "@/types/auth";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?\d{7,15}$/;

export function normalizeUsername(value: string): string {
  const trimmed = value.trim();

  if (trimmed.includes("@")) {
    return trimmed.toLowerCase();
  }

  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[\s\-()]/g, "").replace(/^\+/, "");

  return `${hasPlus ? "+" : ""}${digits}`;
}

export function isValidEmail(value: string): boolean {
  return emailPattern.test(value.trim().toLowerCase());
}

export function isValidPhone(value: string): boolean {
  return phonePattern.test(normalizeUsername(value));
}

export function isValidUsername(value: string): boolean {
  return isValidEmail(value) || isValidPhone(value);
}

export function getUsernameType(value: string): UsernameType {
  return isValidEmail(value) ? "email" : "phone";
}
