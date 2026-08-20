"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { initiateLogin, verifyOTP } from "@/actions/auth";
import Logo from "@/components/Logo";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await initiateLogin(email, password);
    setLoading(false);
    if (result.success && result.showOTP) {
      setShowOTP(true);
    } else {
      setError(result.message);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await verifyOTP(otp);
    setLoading(false);
    if (result.success) {
      router.replace("/");
    } else {
      setError(result.message);
    }
  }

  async function handleResend() {
    setLoading(true);
    setError("");
    // Starting login again sends a fresh OTP and replaces the old challenge.
    const result = await initiateLogin(email, password);
    setLoading(false);
    if (result.success) {
      setError("OTP resent to your email.");
    } else {
      setError(result.message);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] px-4">
      <div className="w-full max-w-sm bg-white border border-[#ebebeb] rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-1">
          <Logo width={80} height={32} />
        </div>
        <p className="text-xs text-[#6a6c72] mb-8">Tenant Dashboard [for APIs]</p>

        {!showOTP ? (
          <>
            <h1 className="text-lg font-semibold text-[#0f172a] mb-6">Sign in</h1>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#64748b]">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-[#ebebeb] text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/10"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs font-medium text-[#64748b]">Password</label>
                  <Link
                    href="/reset/email"
                    className="text-xs font-medium text-[#4166fb] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-[#ebebeb] text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/10"
                  required
                />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="h-10 rounded-lg bg-[#0f172a] text-white text-sm font-medium disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold text-[#0f172a] mb-2">Verify OTP</h1>
            <p className="text-sm text-[#64748b] mb-6">
              Enter the 6-digit code sent to {email}
            </p>
            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#64748b]">OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="h-10 px-3 rounded-lg border border-[#ebebeb] text-sm text-[#0f172a] tracking-[0.5em] text-center font-mono focus:outline-none focus:ring-2 focus:ring-[#0f172a]/10"
                  required
                />
              </div>

              {error && (
                <p className={`text-xs ${error.includes("sent") || error.includes("resent") ? "text-[#05bb5c]" : "text-red-500"}`}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="h-10 rounded-lg bg-[#0f172a] text-white text-sm font-medium disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify"}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="text-xs text-[#4166fb] font-medium hover:underline disabled:opacity-50"
              >
                Resend OTP
              </button>

              <button
                type="button"
                onClick={() => { setShowOTP(false); setOtp(""); setError(""); }}
                className="text-xs text-[#64748b] hover:underline"
              >
                Back to login
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
