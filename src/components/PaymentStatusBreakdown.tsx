"use client";

import { useState } from "react";
import { UnifiedPayment } from "@/actions/payments";

interface PaymentStatusBreakdownProps {
  payments: UnifiedPayment[];
}

export default function PaymentStatusBreakdown({
  payments,
}: PaymentStatusBreakdownProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const counts = {
    success: 0,
    pending: 0,
    failed: 0,
    refunded: 0,
  };

  payments.forEach((p) => {
    const s = p.status?.toLowerCase();
    if (s === "success" || s === "complete" || s === "completed") counts.success++;
    else if (s === "pending" || s === "processing") counts.pending++;
    else if (s === "failed") counts.failed++;
    else if (s === "refunded") counts.refunded++;
  });

  const total = payments.length || 1;
  const statuses = [
    { label: "success", color: "#05bb5c", count: counts.success },
    { label: "pending", color: "#f59e0b", count: counts.pending },
    { label: "failed", color: "#ef4444", count: counts.failed },
    { label: "refunded", color: "#3b82f6", count: counts.refunded },
  ];

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col gap-6 self-stretch shrink-0 min-w-0 w-full lg:w-[324px] p-4 sm:p-[18px] rounded-3xl bg-[#f8fafc] border border-[#ebebeb] overflow-hidden shell-enter">
      <p className="text-lg font-semibold leading-6 text-[#0f172a] whitespace-nowrap">
        Payment status breakdown
      </p>

      <div className="flex flex-col gap-3 items-center justify-center flex-1 min-h-0">
        <div className="w-[180px] h-[180px] sm:w-[200px] sm:h-[200px] relative">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="16" />
            {statuses.map((s) => {
              const pct = s.count / total;
              const dash = circumference * pct;
              const segOffset = offset;
              offset += dash;
              return (
                <circle
                  key={s.label}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="16"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-segOffset}
                  className="transition-opacity cursor-pointer"
                  style={{ opacity: hovered && hovered !== s.label ? 0.4 : 1 }}
                  onMouseEnter={() => setHovered(s.label)}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })}
          </svg>

          {/* Center tooltip */}
          {hovered && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white border border-[#ebebeb] rounded-xl px-3 py-2 shadow-sm text-center">
                <p className="text-xs font-medium text-[#0f172a] capitalize">{hovered}</p>
                <p className="text-sm font-semibold text-[#0f172a]">
                  {statuses.find((s) => s.label === hovered)?.count ?? 0} ({((statuses.find((s) => s.label === hovered)?.count ?? 0) / total * 100).toFixed(0)}%)
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 items-center justify-center">
          {statuses.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-1"
              onMouseEnter={() => setHovered(s.label)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-sm leading-[19px] text-[#0f172a] tracking-[-0.014px] whitespace-nowrap capitalize">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
