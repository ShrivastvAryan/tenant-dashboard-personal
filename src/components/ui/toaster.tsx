"use client";

import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
      {toasts.map((t) => {
        const isSuccess = t.variant === "success";
        const isDestructive = t.variant === "destructive";

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg text-sm font-medium transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
              isSuccess
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : isDestructive
                ? "bg-red-50 border-red-200 text-red-900"
                : "bg-white border-[var(--color-stroke)] text-[#0f172a]"
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            ) : isDestructive ? (
              <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={18} className="text-gray-500 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0">
              {t.title && <div className="font-bold">{t.title}</div>}
              {t.description && <div className="text-xs mt-0.5 opacity-90">{t.description}</div>}
            </div>

            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="p-1 rounded-lg hover:bg-black/5 text-gray-500 transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
