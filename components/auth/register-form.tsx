"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { FormField } from "@/components/auth/form-field";
import { PasswordInput } from "@/components/auth/password-input";
import type { RegisterFormErrors, RegisterFormValues } from "@/types/auth";

const initialValues: RegisterFormValues = {
  studentId: "",
  name: "",
  password: "",
  confirmPassword: "",
};

const knownStudentIds = ["student001", "student-001", "s001"];

function normalizeStudentId(studentId: string) {
  return studentId.trim().toLowerCase();
}

function validateRegister(values: RegisterFormValues): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  if (!values.studentId.trim()) {
    errors.studentId = "Please enter your student ID.";
  }

  if (!values.name.trim()) {
    errors.name = "Please enter your name.";
  }

  if (!values.password) {
    errors.password = "Please enter your password.";
  } else if (values.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (values.password && values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

function getStoredStudentIds() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return JSON.parse(window.sessionStorage.getItem("socratic-registered-student-ids") ?? "[]") as string[];
  } catch {
    return [];
  }
}

function saveRegisteredUser(values: RegisterFormValues) {
  const user = {
    id: `user-${Date.now()}`,
    studentId: values.studentId.trim(),
    name: values.name.trim(),
    role: "student",
  };
  const token = `local-register-token-${Date.now()}`;
  const ids = Array.from(
    new Set([...getStoredStudentIds(), normalizeStudentId(values.studentId)]),
  );

  window.sessionStorage.setItem("socratic-auth-user", JSON.stringify(user));
  window.sessionStorage.setItem("socratic-auth-token", token);
  window.sessionStorage.setItem("socratic-registered-student-ids", JSON.stringify(ids));
}

export function RegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState<RegisterFormValues>(initialValues);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreated, setIsCreated] = useState(false);

  const isFormComplete = useMemo(
    () =>
      values.studentId.trim().length > 0 &&
      values.name.trim().length > 0 &&
      values.password.length >= 6 &&
      values.confirmPassword === values.password,
    [values],
  );

  const updateField = <Key extends keyof RegisterFormValues>(
    field: Key,
    value: RegisterFormValues[Key],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current, [field]: undefined };

      if (field === "password" || field === "confirmPassword") {
        next.confirmPassword = undefined;
      }

      return next;
    });
    setFormError("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateRegister(values);
    setErrors(nextErrors);
    setFormError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const normalizedId = normalizeStudentId(values.studentId);

    if ([...knownStudentIds, ...getStoredStudentIds()].includes(normalizedId)) {
      setErrors((current) => ({
        ...current,
        studentId: "This student ID is already registered.",
      }));
      setFormError("This student ID is already registered.");
      return;
    }

    try {
      setIsLoading(true);

      window.setTimeout(() => {
        saveRegisteredUser(values);
        setIsCreated(true);

        window.setTimeout(() => {
          router.push("/dashboard");
        }, 450);
      }, 450);
    } catch {
      setIsLoading(false);
      setFormError("Unable to create account right now. Please try again later.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {formError ? (
        <div
          role="alert"
          aria-live="assertive"
          className="flex gap-3 rounded-[14px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="M12 7v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 17h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          {formError}
        </div>
      ) : null}

      <FormField
        id="register-student-id"
        label="Student ID"
        type="text"
        value={values.studentId}
        onChange={(event) => updateField("studentId", event.target.value)}
        placeholder="Enter your student ID"
        autoComplete="username"
        disabled={isLoading}
        error={errors.studentId}
        icon={
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
            <rect x="4" y="5" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="10" r="2" stroke="currentColor" strokeWidth="2" />
            <path d="M8 16a4 4 0 0 1 8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        }
      />

      <FormField
        id="register-name"
        label="Name"
        type="text"
        value={values.name}
        onChange={(event) => updateField("name", event.target.value)}
        placeholder="Enter your name"
        autoComplete="name"
        disabled={isLoading}
        error={errors.name}
        icon={
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
            <path d="M5 21a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        }
      />

      <PasswordInput
        id="register-password"
        label="Password"
        value={values.password}
        onChange={(event) => updateField("password", event.target.value)}
        disabled={isLoading}
        error={errors.password}
      />

      <PasswordInput
        id="register-confirm-password"
        label="Confirm Password"
        value={values.confirmPassword}
        onChange={(event) => updateField("confirmPassword", event.target.value)}
        disabled={isLoading}
        error={errors.confirmPassword}
      />

      <button
        type="submit"
        disabled={!isFormComplete || isLoading}
        aria-busy={isLoading}
        className="group flex h-[52px] w-full items-center justify-center gap-3 rounded-xl bg-[linear-gradient(90deg,#6657f5,#4678ff)] px-5 text-base font-bold text-white shadow-lg shadow-indigo-200/80 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-200 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-none disabled:bg-[#ebeaff] disabled:text-[#7b7595] disabled:shadow-none disabled:hover:translate-y-0"
      >
        {isLoading ? (
          <>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 animate-spin" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            {isCreated ? "Account created" : "Creating account..."}
          </>
        ) : (
          "Create Account"
        )}
      </button>

      <p className="pt-0.5 text-center text-sm font-semibold leading-6 text-slate-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="rounded-md font-extrabold text-[#6255f6] underline-offset-4 transition hover:text-[#4b78ff] hover:underline focus:outline-none focus:ring-4 focus:ring-[#6255f6]/10"
        >
          Sign in
        </Link>
      </p>

      <div className="flex items-center gap-5 py-0.5 text-sm text-slate-500">
        <span className="h-px flex-1 bg-slate-200" />
        <span>or</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        disabled={isLoading}
        className="flex h-[50px] w-full items-center justify-center gap-3 rounded-xl border border-[#b9b2ff] bg-white px-5 text-base font-bold text-slate-700 transition hover:border-[#6255f6] hover:bg-indigo-50/60 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <path d="M22 10 12 5 2 10l10 5 10-5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M6 12v5c3.5 2 8.5 2 12 0v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Try as Guest
      </button>
      <p className="-mt-1.5 text-center text-xs font-semibold leading-5 text-slate-500">
        Try a demo task with sample code and AI guidance.
      </p>
    </form>
  );
}
