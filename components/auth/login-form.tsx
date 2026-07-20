"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormField } from "@/components/auth/form-field";
import { PasswordInput } from "@/components/auth/password-input";
import type { LoginFormErrors, LoginFormValues } from "@/types/auth";

const initialValues: LoginFormValues = {
  studentId: "",
  password: "",
  rememberMe: false,
};

function validateLogin(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {};

  if (!values.studentId.trim()) {
    errors.studentId = "Please enter your student ID.";
  }

  if (!values.password) {
    errors.password = "Please enter your password.";
  } else if (values.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  return errors;
}

export function LoginForm() {
  const router = useRouter();
  const [values, setValues] = useState<LoginFormValues>(initialValues);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [formError, setFormError] = useState("");
  const isFormComplete =
    values.studentId.trim().length > 0 && values.password.length >= 6;

  const updateField = <Key extends keyof LoginFormValues>(
    field: Key,
    value: LoginFormValues[Key],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSuccessMessage("");
    setFormError("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateLogin(values);
    setErrors(nextErrors);
    setFormError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setIsLoading(true);
      setSuccessMessage("");

      window.setTimeout(() => {
        setIsSignedIn(true);
        setSuccessMessage("Signed in. Redirecting to dashboard...");

        window.setTimeout(() => {
          router.push("/dashboard");
        }, 450);
      }, 300);
    } catch {
      setIsLoading(false);
      setFormError("Unable to sign in right now. Please try again later.");
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
        id="studentId"
        label="Student ID"
        type="text"
        value={values.studentId}
        onChange={(event) => updateField("studentId", event.target.value)}
        placeholder="Enter your student ID"
        autoComplete="username"
        disabled={isLoading}
        error={errors.studentId}
        icon={
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
          >
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
            <path
              d="M5 21a7 7 0 0 1 14 0"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        }
      />

      <PasswordInput
        id="password"
        label="Password"
        value={values.password}
        onChange={(event) => updateField("password", event.target.value)}
        disabled={isLoading}
        error={errors.password}
      />

      <div className="flex items-center justify-between gap-4 pt-0.5">
        <label className="flex min-w-0 items-center gap-3 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={values.rememberMe}
            onChange={(event) => updateField("rememberMe", event.target.checked)}
            disabled={isLoading}
            className="h-4 w-4 rounded border-slate-300 text-[#6255f6] accent-[#6255f6] focus:ring-4 focus:ring-[#6255f6]/10 disabled:cursor-not-allowed"
          />
          Remember me
        </label>
        <a
          href="#"
          onClick={(event) => event.preventDefault()}
          title="Password recovery is coming soon."
          className="text-sm font-bold text-[#6255f6] transition hover:text-[#4b78ff] hover:underline focus:outline-none focus:ring-4 focus:ring-[#6255f6]/10"
        >
          Forgot password?
        </a>
      </div>

      {successMessage ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
        >
          {successMessage}
        </p>
      ) : null}

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
            {isSignedIn ? "Signed in" : "Signing in..."}
          </>
        ) : (
          <>
            <span className="hidden sm:inline">Sign in to continue thinking</span>
            <span className="sm:hidden">Sign In</span>
          </>
        )}
        {!isLoading ? (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5 transition group-hover:translate-x-0.5"
            fill="none"
          >
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </button>

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
          <path
            d="M22 10 12 5 2 10l10 5 10-5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M6 12v5c3.5 2 8.5 2 12 0v-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Try as Guest
      </button>
      <p className="-mt-1.5 text-center text-xs font-semibold leading-5 text-slate-500">
        Try a demo task with sample code and AI guidance.
      </p>

      <p className="pt-0.5 text-center text-sm font-semibold leading-6 text-slate-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="rounded-md font-extrabold text-[#6255f6] underline-offset-4 transition hover:text-[#4b78ff] hover:underline focus:outline-none focus:ring-4 focus:ring-[#6255f6]/10"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
