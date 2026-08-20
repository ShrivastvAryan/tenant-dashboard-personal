"use client";

import { ReactNode } from "react";
import TopBar from "@/components/TopBar";

interface DashboardShellProps {
  active: string;
  children: ReactNode;
}

export default function DashboardShell({
  children,
}: DashboardShellProps) {
  return (
    <div className="flex w-full min-h-screen min-w-0 overflow-x-hidden bg-[var(--color-shell)]">
      <div className="flex min-w-0 flex-col flex-1 gap-3 p-2 sm:p-4 bg-[var(--color-shell)]">
        <TopBar />

        <main className="flex min-w-0 w-full flex-col gap-6 sm:gap-8 items-center bg-[var(--color-surface)] rounded-[24px] sm:rounded-[28px] px-4 sm:px-8 md:px-12 py-6 flex-1 border border-[var(--color-stroke)] overflow-x-hidden shell-enter">
          <div className="flex min-w-0 flex-col gap-6 sm:gap-8 w-full max-w-[1264px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

