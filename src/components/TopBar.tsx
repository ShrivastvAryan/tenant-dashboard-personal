"use client";

import Logo from "@/components/Logo";

export default function TopBar() {
  return (
    <header className="flex items-center justify-between px-2 sm:px-4 py-2 shrink-0 bg-[var(--color-shell)]">
      <div className="flex items-center gap-1.5 shrink-0">
        <Logo width={76} height={32} className="w-[76px] h-8 object-contain object-left" />
        <span
          className="text-[12px] font-medium text-[#6a6c72] tracking-[-0.5px]"
          style={{ fontFamily: '"Google Sans Code", ui-monospace, monospace' }}
        >
          [for APIs]
        </span>
      </div>
    </header>
  );
}
