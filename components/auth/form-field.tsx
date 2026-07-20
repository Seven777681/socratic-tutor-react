import type { ChangeEventHandler, InputHTMLAttributes, ReactNode } from "react";

type FormFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  error?: string;
  icon?: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "value" | "onChange">;

export function FormField({
  id,
  label,
  value,
  onChange,
  error,
  icon,
  className = "",
  ...inputProps
}: FormFieldProps) {
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800">
        {label}
      </label>
      <div className="relative mt-2.5">
        {icon ? (
          <span className={`pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 ${
            error ? "text-red-500" : "text-slate-500"
          }`}>
            {icon}
          </span>
        ) : null}
        <input
          id={id}
          value={value}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`h-[52px] w-full rounded-[12px] border bg-[#FBFCFF] text-base font-semibold text-slate-950 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-[#6255f6] focus:bg-white focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-100 ${
            icon ? "pl-12 pr-4" : "px-4"
          } ${error ? "border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-red-100" : "border-slate-200"} ${className}`}
          {...inputProps}
        />
      </div>
      {error ? (
        <p id={errorId} className="mt-2 text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
