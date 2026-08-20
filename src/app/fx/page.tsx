"use client";

import DashboardShell from "@/components/DashboardShell";
import PageHeading from "@/components/PageHeading";
import FxConverterCard from "@/components/FxConverterCard";

export default function FxPage() {
  return (
    <DashboardShell active="FX Calc">
      <PageHeading
        title="FX calculator"
        description="Compare local cached pricing with Rampable international pricing for USDC to INR conversions."
      />
      <FxConverterCard />
    </DashboardShell>
  );
}
