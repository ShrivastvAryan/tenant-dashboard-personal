interface StatCardProps {
  title: string;
  value: string | number;
}

export default function StatCard({ title, value }: StatCardProps) {
  return (
    <div className="flex w-full flex-col justify-between flex-1 min-w-0 min-h-[160px] sm:h-[236px] p-4 sm:p-[18px] rounded-[22px] bg-[var(--color-card)] border border-[var(--color-stroke)] overflow-hidden shell-enter">
      <p className="text-base sm:text-lg font-semibold leading-6 text-[#0f172a]">{title}</p>
      <p className="text-[30px] sm:text-[38px] font-semibold leading-none text-[#0f172a] break-words">{value}</p>
    </div>
  );
}
