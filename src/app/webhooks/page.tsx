"use client";

import DashboardShell from "@/components/DashboardShell";
import PageHeading from "@/components/PageHeading";
import ApiKeyCard from "@/components/ApiKeyCard";
import WebhookManagerCard from "@/components/WebhookManagerCard";

export default function WebhooksPage() {
  return (
    <DashboardShell active="Webhooks">
      <PageHeading
        title="Developer tools"
        description="Manage your tenant API key and webhook endpoints from one place."
      />
      <ApiKeyCard />
      <WebhookManagerCard />
    </DashboardShell>
  );
}
