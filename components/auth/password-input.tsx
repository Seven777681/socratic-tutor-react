"use client";

import { useState, type ChangeEventHandler } from "react";

type PasswordInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  error?: string;
  disabled?: boolean;
};

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  error,
  disabled,
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800">
        {label}
      </label>
      <div className="relative mt-3">
        <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 text-slate-700">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
          >
            <rect
              x="5"
              y="10"
              width="14"
              height="10"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M8 10V8a4 4 0 0 1 8 0v2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M12 14v2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <input
          id={id}
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder="Enter your password"
          autoComplete="current-password"
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`h-[52px] w-full rounded-[10px] border bg-white pl-12 pr-14 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#6255f6] focus:ring-4 focus:ring-[#6255f6]/10 disabled:cursor-not-allowed disabled:bg-slate-100 ${
            error ? "border-red-500" : "border-slate-200"
          }`}
        />
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          disabled={disabled}
          aria-label={isVisible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-[#6255f6] transition hover:bg-indigo-50 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/10 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          {isVisible ? (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
            >
              <path
                d="M3 3l18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M10.6 10.6a2 2 0 0 0 2.8 2.8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M9.2 5.4A9.9 9.9 0 0 1 12 5c5 0 8.4 4 9.5 7a12.1 12.1 0 0 1-2.6 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6.5 6.5A12.4 12.4 0 0 0 2.5 12c1.1 3 4.5 7 9.5 7a9.9 9.9 0 0 0 4-.8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
            >
              <path
                d="M2.5 12S6 5 12 5s9.5 7 9.5 7S18 19 12 19s-9.5-7-9.5-7Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
            </svg>
          )}
        </button>
      </div>
      {error ? (
        <p id={errorId} className="mt-2 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
