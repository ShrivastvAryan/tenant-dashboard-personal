"use client";

import { ArrowUpRight, AreaChart as AreaChartIcon, BarChart3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TenantDailyStat } from "@/actions/tenant";

interface PaymentVolumeChartProps {
  volume: number;
  changePercent: number;
  dailyStats: TenantDailyStat[];
}

type Range = "7D" | "1M" | "6M" | "1Y";
type ChartType = "bar" | "area";

interface ChartPoint {
  date: string;
  volume: number;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTickLabel(range: Range, date: string) {
  const parsed =
    range === "6M" || range === "1Y"
      ? new Date(`${date}-01T00:00:00`)
      : new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return date;

  if (range === "7D") {
    return parsed.toLocaleDateString(undefined, { weekday: "short" });
  }
  if (range === "1M") {
    return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return parsed.toLocaleDateString(undefined, { month: "short" });
}

function formatYAxis(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  if (value >= 10) return value.toFixed(0);
  if (value >= 1) return value.toFixed(1);
  return value.toFixed(2);
}

function getComparisonLabel(range: Range) {
  switch (range) {
    case "7D":
      return "compared to last week";
    case "1M":
      return "compared to last month";
    case "6M":
      return "compared to last 6 months";
    case "1Y":
      return "compared to last year";
  }
}

function CustomTooltip({
  active,
  payload,
  label,
  range,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
  range: Range;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg bg-white px-2.5 py-1.5 text-xs shadow-xl border border-[#ebebeb]">
      <div className="font-medium text-[#0f172a]">{formatTickLabel(range, label || "")}</div>
      <div className="text-[#64748b]">Volume</div>
      <div className="font-medium text-black">${Number(payload[0]?.value || 0).toFixed(2)}</div>
    </div>
  );
}

export default function PaymentVolumeChart({
  volume,
  changePercent,
  dailyStats,
}: PaymentVolumeChartProps) {
  const [range, setRange] = useState<Range>("1M");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [isChartReady, setIsChartReady] = useState(false);

  const chartData = useMemo<ChartPoint[]>(() => {
    const now = new Date();
    const statMap = new Map(dailyStats.map((entry) => [entry.date, entry.volume]));

    if (range === "7D" || range === "1M") {
      const totalDays = range === "7D" ? 7 : 30;
      const points: ChartPoint[] = [];

      for (let offset = totalDays - 1; offset >= 0; offset--) {
        const date = new Date(now);
        date.setHours(0, 0, 0, 0);
        date.setDate(now.getDate() - offset);
        const key = formatDateKey(date);
        points.push({
          date: key,
          volume: statMap.get(key) || 0,
        });
      }

      return points;
    }

    const totalMonths = range === "6M" ? 6 : 12;
    const monthBuckets = new Map<string, ChartPoint>();

    for (let offset = totalMonths - 1; offset >= 0; offset--) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthBuckets.set(key, { date: key, volume: 0 });
    }

    for (const entry of dailyStats) {
      const parsed = new Date(`${entry.date}T00:00:00`);
      const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
      const bucket = monthBuckets.get(key);
      if (bucket) bucket.volume += entry.volume;
    }

    return Array.from(monthBuckets.values());
  }, [dailyStats, range]);

  const chartVolume = useMemo(
    () => chartData.reduce((sum, point) => sum + point.volume, 0),
    [chartData]
  );

  useEffect(() => {
    setIsChartReady(false);
    const timer = window.setTimeout(() => setIsChartReady(true), 100);
    return () => window.clearTimeout(timer);
  }, [range, chartType, dailyStats]);

  return (
    <div className="flex w-full flex-col gap-6 sm:gap-8 flex-1 min-w-0 min-h-[360px] sm:h-[384px] p-4 sm:p-[18px] rounded-3xl bg-[#f8fafc] border border-[#ebebeb] overflow-hidden shell-enter">
      <div className="flex items-start justify-between flex-col lg:flex-row gap-4">
        <div className="flex flex-col gap-3 w-full lg:w-[354px]">
          <p className="text-lg font-semibold leading-6 text-[#0f172a]">
            Payment volume
          </p>
          <div className="flex items-center gap-1 flex-wrap">
            <p
              className={`text-[30px] sm:text-[38px] font-semibold leading-none text-[#0f172a] break-all sm:break-normal transition-all duration-300 ${
                isChartReady ? "opacity-100" : "opacity-0"
              }`}
            >
              ${chartVolume.toFixed(2)}
            </p>
            <div className="flex items-center gap-0.5 shrink-0">
              {(changePercent !== 0 || chartVolume > 0) && (
                <>
                  <ArrowUpRight
                    size={24}
                    className={`transition-transform duration-300 ${
                      changePercent >= 0 ? "text-[#05bb5c]" : "text-[#ef4444] rotate-180"
                    }`}
                  />
                  <p className="text-sm leading-[19px]">
                    <span className={changePercent >= 0 ? "text-[#05bb5c]" : "text-[#ef4444]"}>
                      {Math.abs(changePercent).toFixed(0)}%
                    </span>
                    <span className="text-[#64748b]"> {getComparisonLabel(range)}</span>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto">
          <div className="flex items-center gap-3 bg-white p-1 rounded-xl shrink-0 shadow-sm">
            <button
              onClick={() => setChartType("bar")}
              className={`flex items-center justify-center px-2.5 py-1.5 rounded-lg transition-all duration-200 ${
                chartType === "bar" ? "bg-[#f1f5fb]" : "hover:bg-[#f8fafc]"
              }`}
            >
              <BarChart3 size={18} className="text-[#0f172a]" />
            </button>
            <button
              onClick={() => setChartType("area")}
              className={`flex items-center justify-center px-2.5 py-1.5 rounded-lg transition-all duration-200 ${
                chartType === "area" ? "bg-[#f1f5fb]" : "hover:bg-[#f8fafc]"
              }`}
            >
              <AreaChartIcon size={18} className="text-[#0f172a]" />
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 bg-white p-1 rounded-xl overflow-x-auto max-w-full min-w-0 shadow-sm">
            {(["7D", "1M", "6M", "1Y"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setRange(t)}
                className={`px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  range === t
                    ? "bg-[#f1f5fb] text-[#0f172a]"
                    : "text-[#0f172a] hover:bg-[#f8fafc]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`h-[236px] sm:h-[280px] transition-all duration-500 ${
          isChartReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart
              key={`${range}-bar`}
              data={chartData}
              margin={{ left: -20, right: 0, top: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="tenantBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9daffa" stopOpacity={1} />
                  <stop offset="100%" stopColor="#f8fafc" stopOpacity={1} />
                </linearGradient>
              </defs>
              <YAxis
                fontSize={10}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b" }}
                tickFormatter={formatYAxis}
                width={40}
              />
              <XAxis
                dataKey="date"
                fontSize={10}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", dy: 8 }}
                tickFormatter={(value) => formatTickLabel(range, value)}
                minTickGap={8}
              />
              <Tooltip content={<CustomTooltip range={range} />} cursor={false} />
              <Bar
                dataKey="volume"
                fill="url(#tenantBarGradient)"
                radius={[8, 8, 8, 8]}
                isAnimationActive
                animationDuration={800}
              />
            </BarChart>
          ) : (
            <AreaChart
              key={`${range}-area`}
              data={chartData}
              margin={{ left: -20, right: 0, top: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="tenantAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9daffa" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#f8fafc" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <YAxis
                fontSize={10}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b" }}
                tickFormatter={formatYAxis}
                width={40}
              />
              <XAxis
                dataKey="date"
                fontSize={10}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", dy: 8 }}
                tickFormatter={(value) => formatTickLabel(range, value)}
                minTickGap={8}
              />
              <Tooltip content={<CustomTooltip range={range} />} cursor={false} />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#9daffa"
                strokeWidth={2}
                fill="url(#tenantAreaGradient)"
                dot={false}
                isAnimationActive
                animationDuration={1000}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
