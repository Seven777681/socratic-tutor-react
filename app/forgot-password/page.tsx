import { AuthInfoPage } from "@/components/auth/auth-info-page";

export default function ForgotPasswordPage() {
  return (
    <AuthInfoPage
      title="Reset your password"
      subtitle="Enter the username linked to your account, and we will help you recover access."
    >
      <form className="space-y-5" noValidate>
        <label
          htmlFor="account"
          className="block text-sm font-extrabold text-slate-800"
        >
          Username
        </label>
        <input
          id="account"
          type="text"
          autoComplete="username"
          className="h-12 w-full rounded-xl border border-[#dce3f4] bg-[#FBFCFF] px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#6255f6] focus:ring-4 focus:ring-[#6255f6]/10"
          placeholder="Enter your email or phone number"
        />
        <button
          type="button"
          className="flex h-12 w-full items-center justify-center rounded-xl bg-[linear-gradient(90deg,#6657f5,#4678ff)] px-5 text-sm font-bold text-white shadow-lg shadow-indigo-200/80 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-200 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
        >
          Send reset instructions
        </button>
        <p className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-sm font-semibold leading-6 text-slate-600">
          This prototype does not send real emails yet.
        </p>
      </form>
    </AuthInfoPage>
  );
}
