"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { FormField } from "@/components/auth/form-field";
import { PasswordInput } from "@/components/auth/password-input";
import type {
  AuthResponse,
  RegisterFormErrors,
  RegisterFormValues,
  SendVerificationCodeResponse,
} from "@/types/auth";
import { isValidUsername } from "@/lib/auth/username-utils";

const initialValues: RegisterFormValues = {
  username: "",
  verificationCode: "",
  displayName: "",
  password: "",
  confirmPassword: "",
};

function validateRegister(values: RegisterFormValues): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  if (!values.username.trim()) {
    errors.username = "Please enter your username.";
  } else if (!isValidUsername(values.username)) {
    errors.username = "Username must be a valid email address or phone number.";
  }

  if (!values.verificationCode.trim()) {
    errors.verificationCode = "Please enter the verification code.";
  }

  if (!values.displayName.trim()) {
    errors.displayName = "Please enter your display name.";
  } else if (values.displayName.trim().length < 2) {
    errors.displayName = "Display name must be at least 2 characters.";
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

export function RegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState<RegisterFormValues>(initialValues);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [hasSentCode, setHasSentCode] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setResendSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  const isUsernameValid = isValidUsername(values.username);
  const canSendCode =
    values.username.trim().length > 0 &&
    isUsernameValid &&
    !isSendingCode &&
    resendSeconds === 0 &&
    !isLoading;

  const isFormComplete = useMemo(
    () =>
      values.username.trim().length > 0 &&
      values.verificationCode.trim().length > 0 &&
      values.displayName.trim().length >= 2 &&
      values.password.length >= 6 &&
      values.confirmPassword === values.password &&
      hasSentCode,
    [hasSentCode, values],
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

      if (field === "username") {
        next.verificationCode = undefined;
        setHasSentCode(false);
        setSuccessMessage("");
        setResendSeconds(0);
      }

      return next;
    });
    setFormError("");
  };

  const sendCode = async () => {
    if (!values.username.trim()) {
      setErrors((current) => ({
        ...current,
        username: "Please enter your username.",
      }));
      return;
    }

    if (!isValidUsername(values.username)) {
      setErrors((current) => ({
        ...current,
        username: "Username must be a valid email address or phone number.",
      }));
      return;
    }

    try {
      setIsSendingCode(true);
      setFormError("");
      setSuccessMessage("");

      const response = await fetch("/api/auth/send-verification-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: values.username }),
      });
      const result = (await response.json()) as SendVerificationCodeResponse;

      if (!response.ok || !result.success) {
        setErrors((current) => ({ ...current, username: result.message }));
        setFormError(result.message);
        return;
      }

      setHasSentCode(true);
      setResendSeconds(60);
    } catch {
      setFormError("Unable to send verification code right now.");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateRegister(values);
    setErrors(nextErrors);
    setFormError("");

    if (!hasSentCode) {
      setErrors((current) => ({
        ...current,
        verificationCode: "Please request a verification code first.",
      }));
      setFormError("Please request a verification code first.");
      return;
    }

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setIsLoading(true);
      setSuccessMessage("");

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      const result = (await response.json()) as AuthResponse;

      if (!response.ok || !result.success || !result.user || !result.token) {
        setFormError(result.message || "Unable to create account right now.");

        if (result.message.includes("verification code")) {
          setErrors((current) => ({
            ...current,
            verificationCode: result.message,
          }));
        } else if (result.message.includes("username")) {
          setErrors((current) => ({ ...current, username: result.message }));
        }

        setIsLoading(false);
        return;
      }

      window.sessionStorage.setItem("socratic-auth-user", JSON.stringify(result.user));
      window.sessionStorage.setItem("socratic-auth-token", result.token);
      setIsCreated(true);
      setSuccessMessage("Account created. Redirecting to dashboard...");

      window.setTimeout(() => {
        router.push("/dashboard");
      }, 450);
    } catch {
      setIsLoading(false);
      setFormError("Unable to create account right now. Please try again later.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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

      <div>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_128px] sm:items-end">
          <FormField
            id="register-username"
            label="Username"
            type="text"
            value={values.username}
            onChange={(event) => updateField("username", event.target.value)}
            placeholder="Enter your email or phone number"
            autoComplete="username"
            disabled={isLoading || isSendingCode}
            error={errors.username}
            icon={
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                <path d="M5 21a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            }
          />
          <button
            type="button"
            onClick={() => void sendCode()}
            disabled={!canSendCode}
            className="h-[52px] rounded-xl border border-[#b9b2ff] bg-white px-3 text-sm font-extrabold text-[#6255f6] transition hover:border-[#6255f6] hover:bg-indigo-50/60 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/10 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-[#f0efff] disabled:text-[#8c87a6]"
          >
            {isSendingCode
              ? "Sending..."
              : resendSeconds > 0
                ? `Resend in ${resendSeconds}s`
                : hasSentCode
                  ? "Resend Code"
                  : "Send Code"}
          </button>
        </div>
        <p className="mt-1.5 text-[11px] font-semibold leading-5 text-slate-500">
          Use your email or phone number as your username.
        </p>
      </div>

      <div>
        <FormField
          id="register-verification-code"
          label="Verification Code"
          type="text"
          inputMode="numeric"
          value={values.verificationCode}
          onChange={(event) => updateField("verificationCode", event.target.value)}
          placeholder="Enter the 6-digit code"
          autoComplete="one-time-code"
          disabled={isLoading || !hasSentCode}
          error={errors.verificationCode}
        />
        <p className="mt-1.5 text-[11px] font-semibold leading-5 text-slate-500">
          {hasSentCode
            ? "Verification code sent. Use 123456 in this prototype."
            : "Send a code to your username first."}
        </p>
      </div>

      <FormField
        id="register-display-name"
        label="Display Name"
        type="text"
        value={values.displayName}
        onChange={(event) => updateField("displayName", event.target.value)}
        placeholder="Enter your display name"
        autoComplete="name"
        disabled={isLoading}
        error={errors.displayName}
      />

      <PasswordInput
        id="register-password"
        label="Password"
        value={values.password}
        onChange={(event) => updateField("password", event.target.value)}
        placeholder="Create a password"
        disabled={isLoading}
        error={errors.password}
      />

      <PasswordInput
        id="register-confirm-password"
        label="Confirm Password"
        value={values.confirmPassword}
        onChange={(event) => updateField("confirmPassword", event.target.value)}
        placeholder="Confirm your password"
        disabled={isLoading}
        error={errors.confirmPassword}
      />

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
            {isCreated ? "Account created" : "Creating account..."}
          </>
        ) : (
          "Create Account"
        )}
      </button>

      <p className="pt-1 text-center text-sm font-semibold leading-6 text-slate-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="rounded-md font-extrabold text-[#6255f6] underline-offset-4 transition hover:text-[#4b78ff] hover:underline focus:outline-none focus:ring-4 focus:ring-[#6255f6]/10"
        >
          Sign in
        </Link>
      </p>

    </form>
  );
}
