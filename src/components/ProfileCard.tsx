"use client";

import { CurrentUser } from "@/actions/user";
import { TenantBusinessDetails } from "@/actions/businessDetails";
import Link from "next/link";

interface ProfileCardProps {
  user: CurrentUser | null;
  businessDetails?: TenantBusinessDetails | null;
  loading?: boolean;
  error?: string;
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-[var(--color-stroke)] bg-[#f8fafc] p-4">
      <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#64748b]">
        {label}
      </span>
      <span className="text-base font-semibold text-[#0f172a] break-all">
        {value}
      </span>
    </div>
  );
}

export default function ProfileCard({
  user,
  businessDetails,
  loading = false,
  error = "",
}: ProfileCardProps) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-[var(--color-stroke)] bg-[#f8fafc] p-5">
        <div className="h-7 w-40 rounded-lg bg-[#e5e7eb] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-[var(--color-stroke)] bg-[#f8fafc] p-5">
      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#4166fb] to-[#9daffa] text-lg font-semibold text-white">
            {(user?.username || user?.email || "U").slice(0, 1).toUpperCase()}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-semibold text-[#0f172a]">
              {businessDetails?.business_name || user?.username || "User"}
            </span>
            <span className="text-sm text-[#64748b]">
              {user?.email || "No email found"}
            </span>
          </div>
        </div>
        {(businessDetails?.business_type || user?.type) && (
          <span className="rounded-full border border-[#dbe4ff] bg-white px-3 py-1 text-xs font-medium text-[#4166fb]">
            {businessDetails?.business_type || user?.type}
          </span>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <DetailItem
          label="Business Name"
          value={businessDetails?.business_name || "-"}
        />
        <DetailItem
          label="Business Type"
          value={businessDetails?.business_type || user?.type || "-"}
        />
        <DetailItem label="Username" value={user?.username || "User"} />
        <DetailItem label="Email" value={user?.email || "-"} />
        <DetailItem
          label="Member Since"
          value={
            user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString()
              : "-"
          }
        />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-stroke)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#0f172a]">Password</p>
          <p className="mt-1 text-xs text-[#64748b]">
            We will email you a secure link before allowing a password change.
          </p>
        </div>
        <Link
          href={`/reset/email${user?.email ? `?email=${encodeURIComponent(user.email)}` : ""}`}
          className="inline-flex h-9 items-center justify-center rounded-lg bg-[#0f172a] px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Change password
        </Link>
      </div>
    </div>
  );
}
