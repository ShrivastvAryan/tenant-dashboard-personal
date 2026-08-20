"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Plus, RefreshCw } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import {
  createVirtualFiatAccount,
  listOfframpAccounts,
  OfframpAccount,
  OfframpCustomer,
} from "@/actions/offrampV2";
import { getCustomers } from "@/actions/seismic/individual";

type VirtualCurrency = "USD" | "EUR" | "GBP" | "AED";

const accountCountries: Record<VirtualCurrency, string> = {
  USD: "US",
  EUR: "DE",
  GBP: "GB",
  AED: "AE",
};

function accountSummary(account: OfframpAccount) {
  const details = account.details || {};
  const accountLast4 = typeof details.accountNumberLast4 === "string" ? details.accountNumberLast4 : null;
  const walletLast4 = typeof details.walletAddressLast4 === "string" ? details.walletAddressLast4 : null;
  if (walletLast4) return `Wallet ending ${walletLast4}`;
  if (accountLast4) return `Account ending ${accountLast4}`;
  return "Provisioning details pending";
}

export default function VirtualAccountsPage() {
  const email = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get("email") || "";
  const [customers, setCustomers] = useState<OfframpCustomer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [accounts, setAccounts] = useState<OfframpAccount[]>([]);
  const [currency, setCurrency] = useState<VirtualCurrency>("USD");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const customer = useMemo(
    () => customers.find((item) => item.id === customerId) || null,
    [customerId, customers],
  );

  async function loadAccounts(selectedId = customerId) {
    if (!selectedId || !email) return;
    setLoading(true);
    const result = await listOfframpAccounts(selectedId, email);
    setAccounts(result.success ? result.data : []);
    setError(result.success ? "" : result.error);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!email) {
        setError("Customer email is missing.");
        setLoading(false);
        return;
      }
      try {
        const res = await getCustomers(email);
        if (cancelled) return;
        const custs: OfframpCustomer[] = res?.data?.customers || res?.customers || (Array.isArray(res?.data) ? res.data : []);
        setCustomers(custs);
        setCustomerId(custs[0]?.id || "");
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message || "Failed to load customers.");
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [email]);

  useEffect(() => {
    if (customerId) void loadAccounts(customerId);
  }, [customerId]);

  async function createAccount(event: FormEvent) {
    event.preventDefault();
    if (!customer) return;
    setCreating(true);
    setError("");
    const result = await createVirtualFiatAccount({
      customerId: customer.id,
      email,
      country: accountCountries[currency],
      currency,
    });
    if (!result.success) {
      setError(result.error);
      setCreating(false);
      return;
    }
    await loadAccounts(customer.id);
    setCreating(false);
  }

  return (
    <DashboardShell active="Customers">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/customers" className="inline-flex items-center gap-1 text-sm text-[#64748b] hover:text-[#0f172a]">
            <ArrowLeft size={16} /> Customers
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-[#0f172a]">Virtual accounts</h1>
          <p className="mt-1 text-sm text-[#64748b]">{email || "Customer"}</p>
        </div>
        <button
          type="button"
          onClick={() => void loadAccounts()}
          disabled={!customerId || loading}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-stroke)] px-3 py-2 text-sm font-medium text-[#0f172a] disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {error ? <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">{error}</div> : null}

      {!loading && customers.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-stroke)] bg-[#f8fafc] px-4 py-5 text-sm text-[#64748b]">
          No Offramp V2 profile has been created for this customer.
        </div>
      ) : null}

      {customers.length > 1 ? (
        <label className="flex max-w-xs flex-col gap-2 text-sm font-medium text-[#0f172a]">
          Verification profile
          <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="rounded-xl border border-[var(--color-stroke)] bg-white px-3 py-2 text-sm">
            {customers.map((item) => <option key={item.id} value={item.id}>{item.profileType}</option>)}
          </select>
        </label>
      ) : null}

      {customer ? (
        <form onSubmit={createAccount} className="flex flex-wrap items-end gap-3 rounded-xl border border-[var(--color-stroke)] bg-[#f8fafc] p-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-[#0f172a]">
            Currency
            <select value={currency} onChange={(event) => setCurrency(event.target.value as VirtualCurrency)} className="rounded-xl border border-[var(--color-stroke)] bg-white px-3 py-2 text-sm">
              {Object.keys(accountCountries).map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <button type="submit" disabled={creating} className="inline-flex items-center gap-2 rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Create virtual account
          </button>
        </form>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-[var(--color-stroke)]">
        <div className="grid grid-cols-[1.2fr_repeat(4,minmax(0,1fr))] gap-3 border-b border-[var(--color-stroke)] bg-[#f8fafc] px-4 py-3 text-xs font-semibold uppercase text-[#64748b]">
          <span>Name</span><span>Type</span><span>Currency</span><span>Status</span><span>Details</span>
        </div>
        {loading ? <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-[#64748b]" /></div> : null}
        {!loading && accounts.length === 0 ? <div className="px-4 py-6 text-sm text-[#64748b]">No virtual accounts yet.</div> : null}
        {accounts.map((account) => (
          <div key={account.id} className="grid grid-cols-[1.2fr_repeat(4,minmax(0,1fr))] gap-3 border-b border-[var(--color-stroke)] px-4 py-3 text-sm last:border-0">
            <span className="truncate font-medium text-[#0f172a]">{account.display_name}</span>
            <span className="capitalize text-[#475569]">{account.instrument_type.replaceAll("_", " ")}</span>
            <span>{account.currency}</span>
            <span className="capitalize">{account.status.replaceAll("_", " ")}</span>
            <span className="truncate text-[#64748b]" title={accountSummary(account)}>{accountSummary(account)}</span>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
