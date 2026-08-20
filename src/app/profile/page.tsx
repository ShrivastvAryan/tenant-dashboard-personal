"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import PageHeading from "@/components/PageHeading";
import ProfileCard from "@/components/ProfileCard";
import { CurrentUser, GetCurrentUser } from "@/actions/user";
import {
  GetBusinessDetails,
  TenantBusinessDetails,
} from "@/actions/businessDetails";

export default function ProfilePage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [businessDetails, setBusinessDetails] =
    useState<TenantBusinessDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const [userRes, businessRes] = await Promise.all([
        GetCurrentUser(),
        GetBusinessDetails(),
      ]);

      if (userRes.success && userRes.data) {
        setUser(userRes.data);
      } else {
        setError(userRes.error || "Failed to load profile");
      }

      if (businessRes.success && businessRes.data) {
        setBusinessDetails(businessRes.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <DashboardShell active="Profile">
      <PageHeading
        title="Profile"
        description="Your tenant dashboard account details and reward summary."
      />
      <ProfileCard
        user={user}
        businessDetails={businessDetails}
        loading={loading}
        error={error}
      />
    </DashboardShell>
  );
}
