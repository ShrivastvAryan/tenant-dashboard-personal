"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { requestResetPassword } from "@/actions/auth";

export default function ResetPasswordRequestForm({ initialEmail = "" }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess(false);

    const result = await requestResetPassword(email);
    setLoading(false);
    setSuccess(result.success);
    setMessage(
      result.success
        ? "Check your email for a secure password reset link."
        : result.message
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="reset-email" className="text-xs font-medium text-[#64748b]">
          Email
        </label>
        <input
          id="reset-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          className="h-10 rounded-lg border border-[#ebebeb] px-3 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/10"
          required
          disabled={loading}
        />
      </div>

      {message && (
        <p role="status" className={`text-xs ${success ? "text-[#05bb5c]" : "text-red-500"}`}>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="h-10 rounded-lg bg-[#0f172a] text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send reset link"}
      </button>
      <Link href="/login" className="text-center text-xs font-medium text-[#4166fb] hover:underline">
        Back to sign in
      </Link>
    </form>
  );
}
