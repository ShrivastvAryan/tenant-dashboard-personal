"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { resetPassword, verifyPasswordResetToken } from "@/actions/auth";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verifying, setVerifying] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function verify() {
      if (!token) {
        setMessage("This password reset link is missing its token.");
        setVerifying(false);
        return;
      }

      const result = await verifyPasswordResetToken(token);
      if (!active) return;
      setValidToken(result.success);
      setMessage(result.success ? "" : result.message);
      setVerifying(false);
    }

    verify();
    return () => { active = false; };
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password.length < 8 || password.length > 128) {
      setMessage("Password must be between 8 and 128 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    const result = await resetPassword(token, password);
    setLoading(false);
    if (!result.success) {
      setMessage(result.message);
      return;
    }

    setCompleted(true);
  }

  if (verifying) {
    return <p className="py-6 text-center text-sm text-[#64748b]">Verifying reset link...</p>;
  }

  if (!validToken) {
    return (
      <div className="flex flex-col gap-4">
        <p role="alert" className="text-sm text-red-500">{message}</p>
        <Link href="/reset/email" className="text-center text-xs font-medium text-[#4166fb] hover:underline">
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="flex flex-col gap-4">
        <p role="status" className="text-sm text-[#05bb5c]">
          Your password has been reset. You can now sign in with your new password.
        </p>
        <Link href="/login" className="text-center text-xs font-medium text-[#4166fb] hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="new-password" className="text-xs font-medium text-[#64748b]">New password</label>
        <input
          id="new-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          className="h-10 rounded-lg border border-[#ebebeb] px-3 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/10"
          required
          disabled={loading}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="confirm-password" className="text-xs font-medium text-[#64748b]">Confirm new password</label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          className="h-10 rounded-lg border border-[#ebebeb] px-3 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/10"
          required
          disabled={loading}
        />
      </div>

      {message && <p role="alert" className="text-xs text-red-500">{message}</p>}

      <button
        type="submit"
        disabled={loading}
        className="h-10 rounded-lg bg-[#0f172a] text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Resetting..." : "Reset password"}
      </button>
    </form>
  );
}
