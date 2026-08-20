"use client";

import Link from "next/link";
import {
  ChangeEvent,
  Dispatch,
  FormEvent,
  ReactNode,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Key,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Send,
  ChevronsUpDown,
  X,
  Users,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import DashboardShell from "@/components/DashboardShell";
import TopBar from "@/components/TopBar";
import StatCard from "@/components/StatCard";
import { GetTenantStats, TenantStats, GetTenantUsers, SubUser, SubUsersPage } from "@/actions/tenant";
import { OfframpCustomer } from "@/actions/offrampV2";
import { createCustomer, getCustomers, CreateCustomerPayload } from "@/actions/seismic/individual";
import KycForm from "@/components/seismic/kyc";
import KybForm from "@/components/seismic/kyb";
import { toast } from "@/hooks/use-toast";


type CountryConfig = {
  label: string;
  value: string;
  currency: string;
  requiredBankFields: string[];
};

type KybDocumentConfig = {
  key: string;
  label: string;
  min: number;
  max: number;
  grouped?: boolean;
  pair?: string;
};

type CustomerConfig = {
  supportedCountries: CountryConfig[];
  kybDocuments: KybDocumentConfig[];
};

type BankMaster = {
  _id?: string;
  name: string;
  paymentCode: string;
  country?: string;
  currency?: string;
};

const INCOME_RANGES = ["<10L", "10L-15L", "15L-20L", "20L-25L", "25L-50L", ">50L"];
const NRI_DOCUMENT_FIELDS = ["drivingLicense", "workVisa", "emiratesId"] as const;

type PersonFileEntry = {
  file: File | null;
  reuseRole: "" | "representative" | "director" | "ubo";
  reuseIndex: string;
};

type UboEntry = {
  frontFile: File | null;
  backFile: File | null;
  phone: string;
  reuseRole: "" | "representative" | "director" | "ubo";
  reuseIndex: string;
};

type CustomerMode = "business" | "individual";
type IndividualKycType = "regular" | "nri";

function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function createEmptyForm() {
  return {
    apiKey: "",
    email: "",
    businessName: "",
    contactName: "",
    address: "",
    city: "",
    postCode: "",
    reference: "",
    country: "IN",
    currency: "INR",
    accountName: "",
    accountNumber: "",
    bankName: "",
    paymentCode: "",
    ifsc: "",
    ibanNumber: "",
    accountType: "Checking",
    uboPhoneNumber: "",
  };
}

function createEmptyIndividualForm() {
  return {
    apiKey: "",
    email: "",
    firstName: "",
    lastName: "",
    fullName: "",
    dob: "",
    panNumber: "",
    aadharNumber: "",
    incomeRange: "",
    profession: "",
    phone: "",
    countryCode: "91",
    address: "",
    city: "",
    postCode: "",
    state: "",
    locality: "",
    district: "",
    landmark: "",
    drivingLicenseNumber: "",
    workVisaNumber: "",
    emiratesIdNumber: "",
    country: "IN",
    currency: "INR",
    accountName: "",
    accountNumber: "",
    bankName: "",
    paymentCode: "",
    ifsc: "",
    accountType: "Checking",
    branchAddress: "",
    reference: "",
  };
}

function createEmptyBankLinkForm() {
  return {
    apiKey: "",
    email: "",
    name: "",
    accountName: "",
    accountNumber: "",
    bankName: "",
    paymentCode: "",
    ifsc: "",
    accountType: "Checking",
    branchAddress: "",
    address: "",
    city: "",
    postCode: "",
    reference: "",
  };
}

function createEmptyOrderForm() {
  return {
    apiKey: "",
    email: "",
    sellTokenSymbol: "USDC",
    chainId: "137",
    fiatCurrency: "INR",
    sellTokenAmount: "",
    refundWalletAddress: "",
    accountNumber: "",
    ifsc: "",
    isNRI: false,
  };
}

type OrderDepositPreview = {
  depositAddress: string;
  chainId: number;
  chainCode?: string;
  sellTokenSymbol: string;
  sellTokenAddress?: string;
};

type OrderBalancePreview = {
  walletAddress: string;
  walletId?: string;
  chainId: number;
  chainCode?: string;
  sellTokenSymbol: string;
  walletBalance: string;
  totalRequired?: string | null;
  balanceSufficient?: boolean | null;
};

function humanizeKybDocument(documentKey: string) {
  const cleaned = documentKey
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/(\D)(\d+)$/, "$1 $2")
    .replace(/^cin Or Gstin Or B Pan$/i, "CIN / GSTIN / Business PAN")
    .replace(/^ubo Pan Front/i, "UBO PAN Front")
    .replace(/^ubo Pan Back/i, "UBO PAN Back")
    .replace(/^business Representative Pan/i, "Business Representative PAN")
    .replace(/^business Director Pan/i, "Business Director PAN");

  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((part) => (part === part.toUpperCase() ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(" ");
}

function getBankAccountChannel(provider?: string) {
  if ((provider || "").toLowerCase() === "rampable") return "International";
  if ((provider || "").toLowerCase() === "onmeta") return "Local";
  return provider || "Bank";
}

function offrampVerificationLabel(subUser: SubUser | null, customers: OfframpCustomer[]) {
  const providerStatus = (subUser?.provider_status || "").toLowerCase();
  
  if (customers.length) {
    return customers
      .map((customer) => {
        const kind = customer.profileType === "business" ? "KYB" : "KYC";
        const status = customer.verification.status || customer.verification.profile?.status || "not started";
        return `${kind}: ${status.replaceAll("_", " ")}`;
      })
      .join(" · ");
  }

  if (["submitted", "under_review", "approved", "completed", "active", "enrolled"].includes(providerStatus)) {
    return "Enrolled";
  }

  return "Not enrolled";
}

function customerTypeLabel(customer: SubUser | null, offrampCustomers: OfframpCustomer[]) {
  const profileType = (customer?.profile_type || customer?.type || "")?.toLowerCase();
  if (profileType.includes("business") || profileType.includes("kyb")) return "business";
  if (profileType.includes("individual") || profileType.includes("kyc")) return "individual";
  if (offrampCustomers[0]?.profileType) return offrampCustomers[0].profileType;
  return profileType || "individual";
}

function getCustomerProfileType(customer: SubUser, offrampCustomers: OfframpCustomer[]): "business" | "individual" {
  const profileType = (customer?.profile_type || customer?.type || "")?.toLowerCase();
  if (profileType.includes("business") || profileType.includes("kyb")) return "business";
  if (profileType.includes("individual") || profileType.includes("kyc")) return "individual";

  const bizOfframp = offrampCustomers.find((c) => c.profileType === "business");
  if (bizOfframp) return "business";
  const indOfframp = offrampCustomers.find((c) => c.profileType === "individual");
  if (indOfframp) return "individual";
  const offramp = offrampCustomers[0];
  if (offramp?.profileType) {
    return offramp.profileType;
  }
  return "individual";
}

export default function CustomersPage() {
  const [query, setQuery] = useState("");
  const [tenantStats, setTenantStats] = useState<TenantStats | null>(null);
  const [users, setUsers] = useState<SubUsersPage>({
    count: 0,
    total_pages: 1,
    page_number: 1,
    per_page: 10,
    next: null,
    previous: null,
    results: [],
  });
  const [loading, setLoading] = useState(true);
  const [offrampCustomersByEmail, setOfframpCustomersByEmail] = useState<Record<string, OfframpCustomer[]>>({});


  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [createCustomerVisible, setCreateCustomerVisible] = useState(false);
  const [customerDetailsVisible, setCustomerDetailsVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<SubUser | null>(null);
  const [kycModalCustomer, setKycModalCustomer] = useState<SubUser | null>(null);
  const [kycModalVisible, setKycModalVisible] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);

  async function openKycModalForCustomer(customer: SubUser) {
    let offrampCusts = offrampCustomersByEmail[customer.email] || offrampCustomersByEmail[customer.email?.toLowerCase()] || [];
    try {
      const res = await getCustomers(customer.email);
      const fetchedCusts = res?.data?.customers || res?.customers || (Array.isArray(res?.data) ? res.data : []);
      if (fetchedCusts && fetchedCusts.length > 0) {
        offrampCusts = fetchedCusts;
        setOfframpCustomersByEmail((current) => ({
          ...current,
          [customer.email]: offrampCusts,
          [customer.email.toLowerCase()]: offrampCusts,
        }));
      }
    } catch (err) {
      console.error("[openKycModalForCustomer] Error fetching offramp customer:", err);
    }

    const profileType = getCustomerProfileType(customer, offrampCusts);
    console.log("[Resume KYC/KYB Clicked]", {
      email: customer.email,
      customerId: customer.id,
      profileType,
      offrampCustomers: offrampCusts,
    });
    setKycModalCustomer(customer);
    setKycModalVisible(true);
  }

  function closeKycModal() {
    setKycModalVisible(false);
    setTimeout(() => {
      setKycModalCustomer(null);
    }, 200);
  }
  const [actionMenuPosition, setActionMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [bankLinkCustomer, setBankLinkCustomer] = useState<SubUser | null>(null);
  const [bankLinkVisible, setBankLinkVisible] = useState(false);
  const [orderCustomer, setOrderCustomer] = useState<SubUser | null>(null);
  const [orderVisible, setOrderVisible] = useState(false);
  const [customerConfig, setCustomerConfig] = useState<CustomerConfig>({
    supportedCountries: [],
    kybDocuments: [],
  });
  const [bankMasters, setBankMasters] = useState<BankMaster[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [bankPopoverOpen, setBankPopoverOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState("");

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [refreshingKycCustomerId, setRefreshingKycCustomerId] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [availableApiKey, setAvailableApiKey] = useState("");
  const [inputApiKey, setInputApiKey] = useState("");
  const [customerMode, setCustomerMode] = useState<CustomerMode>("business");
  const [individualKycType, setIndividualKycType] = useState<IndividualKycType>("regular");
  const [businessForm, setBusinessForm] = useState(createEmptyForm());
  const [individualForm, setIndividualForm] = useState(createEmptyIndividualForm());
  const [bankLinkForm, setBankLinkForm] = useState(createEmptyBankLinkForm());
  const [orderForm, setOrderForm] = useState(createEmptyOrderForm());
  const [createdRecipient, setCreatedRecipient] = useState<any>(null);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [orderDepositPreview, setOrderDepositPreview] = useState<OrderDepositPreview | null>(null);
  const [orderBalancePreview, setOrderBalancePreview] = useState<OrderBalancePreview | null>(null);
  const [orderBalanceLoading, setOrderBalanceLoading] = useState(false);
  const [orderBalanceRefreshLocked, setOrderBalanceRefreshLocked] = useState(false);

  const [cinFile, setCinFile] = useState<File | null>(null);
  const [regularKycFiles, setRegularKycFiles] = useState({
    selfie: null as File | null,
    aadharFront: null as File | null,
    aadharBack: null as File | null,
    panFront: null as File | null,
    panBack: null as File | null,
  });
  const [nriKycFiles, setNriKycFiles] = useState({
    drivingLicense: null as File | null,
    workVisa: null as File | null,
    emiratesId: null as File | null,
    selfie: null as File | null,
  });
  const [representativeCount, setRepresentativeCount] = useState(1);
  const [directorCount, setDirectorCount] = useState(2);
  const [uboCount, setUboCount] = useState(1);
  const [representativeEntries, setRepresentativeEntries] = useState<PersonFileEntry[]>([
    { file: null, reuseRole: "", reuseIndex: "" },
  ]);
  const [directorEntries, setDirectorEntries] = useState<PersonFileEntry[]>([
    { file: null, reuseRole: "", reuseIndex: "" },
    { file: null, reuseRole: "", reuseIndex: "" },
  ]);
  const [uboEntries, setUboEntries] = useState<UboEntry[]>([
    { frontFile: null, backFile: null, phone: "", reuseRole: "", reuseIndex: "" },
  ]);

  useEffect(() => {
    async function load() {
      const [statsRes, usersRes, configRes] = await Promise.all([
        GetTenantStats(),
        GetTenantUsers(1),
        fetch("/api/customers/business", { cache: "no-store" }).then((res) => res.json()),
      ]);

      if (statsRes.success) setTenantStats(statsRes.data || null);
      setUsers(usersRes);
      if (configRes?.success) {
        setCustomerConfig(configRes.data);
        const defaultCountry = configRes.data.supportedCountries?.[0];
        if (defaultCountry) {
          setBusinessForm((current) => ({
            ...current,
            country: defaultCountry.value,
            currency: defaultCountry.currency,
          }));
        }
      }

      setLoading(false);
    }
    load();
  }, []);

  // Offramp customer data (id, profileType, verification) is fetched on-demand
  // when the user clicks "Resume KYC" via openKycModalForCustomer().
  // No auto-fetching on page load to avoid N API calls per customer row.

  useEffect(() => {
    if (!showCreateCustomer) return;
    if (typeof window === "undefined") return;

    const latestApiKey = availableApiKey || window.sessionStorage.getItem("tenant-dashboard:latest-api-key") || "";
    if (!latestApiKey) return;
    setBusinessForm((current) => ({ ...current, apiKey: latestApiKey }));
    setIndividualForm((current) => ({ ...current, apiKey: latestApiKey }));
    setBankLinkForm((current) => ({ ...current, apiKey: latestApiKey }));
    setOrderForm((current) => ({ ...current, apiKey: latestApiKey }));
  }, [availableApiKey, showCreateCustomer, bankLinkCustomer]);

  useEffect(() => {
    if (!showCreateCustomer) {
      setCreateCustomerVisible(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setCreateCustomerVisible(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [showCreateCustomer]);

  useEffect(() => {
    if (!selectedCustomer) {
      setCustomerDetailsVisible(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setCustomerDetailsVisible(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedCustomer]);

  useEffect(() => {
    if (!bankLinkCustomer) {
      setBankLinkVisible(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setBankLinkVisible(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [bankLinkCustomer]);

  useEffect(() => {
    if (!orderCustomer) {
      setOrderVisible(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setOrderVisible(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [orderCustomer]);

  useEffect(() => {
    async function loadBanks() {
      if (!showCreateCustomer && !bankLinkCustomer) return;
      setBanksLoading(true);
      try {
        const bankCountry = bankLinkCustomer
          ? "INDIA"
          : customerMode === "individual"
            ? individualForm.country
            : businessForm.country;
        const response = await fetch(`/api/banks?country=${encodeURIComponent(bankCountry)}`, {
          cache: "no-store",
        });
        const data = await response.json().catch(() => []);
        setBankMasters(Array.isArray(data) ? data : []);
      } catch {
        setBankMasters([]);
      } finally {
        setBanksLoading(false);
      }
    }

    loadBanks();
  }, [bankLinkCustomer, businessForm.country, customerMode, individualForm.country, showCreateCustomer]);

  useEffect(() => {
    const shouldLock = showCreateCustomer || Boolean(selectedCustomer) || Boolean(bankLinkCustomer) || Boolean(orderCustomer) || Boolean(kycModalCustomer);
    if (!shouldLock) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [bankLinkCustomer, orderCustomer, showCreateCustomer, selectedCustomer, kycModalCustomer]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return users.results;
    return users.results.filter((user) =>
      [user.name, user.email, user.id, user.type, user.is_active ? "active" : "inactive"]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery))
    );
  }, [query, users.results]);

  const totalRevenue = filteredUsers.reduce((sum, u) => sum + (u.volume || 0), 0);
  const selectedCountryValue = customerMode === "individual" ? individualForm.country : businessForm.country;
  const selectedCountry = customerConfig.supportedCountries.find(
    (country) => country.value === selectedCountryValue
  );
  const selectedOfframpCustomers = selectedCustomer
    ? offrampCustomersByEmail[selectedCustomer.email] || offrampCustomersByEmail[selectedCustomer.email?.toLowerCase()] || []
    : [];
  const selectedCustomerType = customerTypeLabel(selectedCustomer, selectedOfframpCustomers);
  const filteredBankMasters = bankMasters.filter((bank) =>
    bank.name.toLowerCase().includes(bankSearch.trim().toLowerCase())
  );
  const actionMenuCustomer = openActionMenuId
    ? filteredUsers.find((user) => user.id === openActionMenuId) || null
    : null;

  function applyTenantApiKey(nextApiKey: string) {
    setAvailableApiKey(nextApiKey);
    setInputApiKey(nextApiKey);
    if (typeof window !== "undefined") {
      if (nextApiKey.trim()) {
        window.sessionStorage.setItem("tenant-dashboard:latest-api-key", nextApiKey.trim());
        document.cookie = `tenant-api-key=${encodeURIComponent(nextApiKey.trim())}; path=/; SameSite=Lax`;
      } else {
        window.sessionStorage.removeItem("tenant-dashboard:latest-api-key");
        document.cookie = "tenant-api-key=; path=/; max-age=0; SameSite=Lax";
      }
    }
    setBusinessForm((current) => ({ ...current, apiKey: nextApiKey.trim() }));
    setIndividualForm((current) => ({ ...current, apiKey: nextApiKey.trim() }));
    setBankLinkForm((current) => ({ ...current, apiKey: nextApiKey.trim() }));
    setOrderForm((current) => ({ ...current, apiKey: nextApiKey.trim() }));
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const latestApiKey = window.sessionStorage.getItem("tenant-dashboard:latest-api-key") || "";
    if (latestApiKey) applyTenantApiKey(latestApiKey);
  }, []);

  const pendingKycEmailKey = useMemo(() => {
    const pendingStatuses = new Set(["PENDING", "STARTED", "IN_REVIEW", "SUBMITTED"]);
    return users.results
      .filter((user) => {
        const type = (user.type || "").toLowerCase();
        const status = (user.details?.kyc_status || "").toUpperCase();
        return type === "individual" && !user.details?.kyc_verified && pendingStatuses.has(status);
      })
      .map((user) => user.email)
      .filter(Boolean)
      .join("|");
  }, [users.results]);

  const syncPendingKycStatuses = useCallback(async () => {
    if (!pendingKycEmailKey || typeof window === "undefined") return;

    const apiKey = (availableApiKey || window.sessionStorage.getItem("tenant-dashboard:latest-api-key") || "").trim();
    if (!apiKey) return;

    const pendingEmails = pendingKycEmailKey.split("|").filter(Boolean);

    const results = await Promise.allSettled(
      pendingEmails.map((email) =>
        fetch("/api/customers/individual/kyc-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, apiKey }),
          cache: "no-store",
        }).then(async (response) => ({
          ok: response.ok,
          data: await response.json().catch(() => ({})),
        }))
      )
    );

    const hadSuccessfulSync = results.some(
      (result) => result.status === "fulfilled" && result.value.ok && result.value.data?.success
    );

    if (hadSuccessfulSync) {
      const usersRes = await GetTenantUsers(users.page_number);
      setUsers(usersRes);
    }
  }, [availableApiKey, pendingKycEmailKey, users.page_number]);

  useEffect(() => {
    if (!pendingKycEmailKey) return;

    let cancelled = false;
    let inFlight = false;

    async function syncPendingKyc() {
      if (inFlight) return;
      inFlight = true;

      try {
        if (!cancelled) await syncPendingKycStatuses();
      } finally {
        inFlight = false;
      }
    }

    syncPendingKyc();
    const intervalId = window.setInterval(syncPendingKyc, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [pendingKycEmailKey, syncPendingKycStatuses]);

  async function handleRefreshCustomerKyc(customer: SubUser) {
    const apiKey =
      typeof window !== "undefined"
        ? (availableApiKey || window.sessionStorage.getItem("tenant-dashboard:latest-api-key") || "").trim()
        : "";

    if (!apiKey) {
      setSubmitError("API key is required to refresh KYC status.");
      return;
    }

    setSubmitError("");
    setSubmitSuccess("");
    setRefreshingKycCustomerId(customer.id);
    setOpenActionMenuId(null);
    setActionMenuPosition(null);

    try {
      const response = await fetch("/api/customers/individual/kyc-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: customer.email, apiKey }),
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error || data?.data?.error || "KYC status refresh failed");
      }

      const usersRes = await GetTenantUsers(users.page_number);
      setUsers(usersRes);
      if (selectedCustomer?.id === customer.id) {
        setSelectedCustomer(usersRes.results.find((user) => user.id === customer.id) || selectedCustomer);
      }
      setSubmitSuccess(`KYC status refreshed for ${customer.email}.`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "KYC status refresh failed");
    } finally {
      setRefreshingKycCustomerId(null);
    }
  }

  async function handlePageChange(page: number) {
    const res = await GetTenantUsers(page);
    setUsers(res);
  }

  function handleExportCSV() {
    const headers = ["Customer Name", "Email", "Volume", "Business/Individual", "Status"];
    const rows = filteredUsers.map((u) => [
      u.name || u.email.split("@")[0],
      u.email,
      `$${(u.volume || 0).toFixed(2)}`,
      u.type || "Unknown",
      u.is_active ? "Active" : "Inactive",
    ]);
    downloadCSV("customers.csv", headers, rows);
  }

  function getPages(): (number | string)[] {
    const totalPages = users.total_pages;
    const current = users.page_number;
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push("...");
      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }

  function resetCreateFlow() {
    setCurrentStep(1);
    setSubmitError("");
    setCreatedRecipient(null);
    setBankPopoverOpen(false);
    setBankSearch("");
    setCustomerMode("business");
    setIndividualKycType("regular");
    setBusinessForm(createEmptyForm());
    setIndividualForm(createEmptyIndividualForm());
    setCinFile(null);
    setRegularKycFiles({
      selfie: null,
      aadharFront: null,
      aadharBack: null,
      panFront: null,
      panBack: null,
    });
    setNriKycFiles({
      drivingLicense: null,
      workVisa: null,
      emiratesId: null,
      selfie: null,
    });
    setRepresentativeCount(1);
    setDirectorCount(2);
    setUboCount(1);
    setRepresentativeEntries([{ file: null, reuseRole: "", reuseIndex: "" }]);
    setDirectorEntries([
      { file: null, reuseRole: "", reuseIndex: "" },
      { file: null, reuseRole: "", reuseIndex: "" },
    ]);
    setUboEntries([{ frontFile: null, backFile: null, phone: "", reuseRole: "", reuseIndex: "" }]);
  }

  async function openCreateModal(payload?: CreateCustomerPayload) {
    closeActionMenu();
    resetCreateFlow();
    if (typeof window !== "undefined") {
      const latestApiKey = availableApiKey || window.sessionStorage.getItem("tenant-dashboard:latest-api-key") || "";
      if (latestApiKey) {
        setBusinessForm((current) => ({ ...current, apiKey: latestApiKey }));
        setIndividualForm((current) => ({ ...current, apiKey: latestApiKey }));
      }
    }
    setSubmitSuccess("");
    setShowCreateCustomer(true);

    if (payload && payload.email) {
      try {
        setSubmitting(true);
        const res = await createCustomer(payload);
        const customerId = res?.customer_id || res?.id || res?.data?.customer_id || res?.data?.id;
        if (customerId) {
          setSubmitSuccess(`Customer created with ID: ${customerId}`);
        }
      } catch (err: any) {
        console.error("Error creating customer from openCreateModal:", err);
        setSubmitError(err?.message || "Customer creation failed");
      } finally {
        setSubmitting(false);
      }
    }
  }

  function closeCreateModal() {
    setShowCreateCustomer(false);
    setSubmitting(false);
    setSubmitError("");
  }

  function updateBusinessField(field: keyof ReturnType<typeof createEmptyForm>, value: string) {
    const cleanValue = field === "postCode" && typeof value === "string" ? value.replace(/\D/g, "") : value;
    setBusinessForm((current) => ({ ...current, [field]: cleanValue }));
  }

  function updateIndividualField(field: keyof ReturnType<typeof createEmptyIndividualForm>, value: string) {
    const cleanValue = field === "postCode" && typeof value === "string" ? value.replace(/\D/g, "") : value;
    setIndividualForm((current) => ({ ...current, [field]: cleanValue }));
  }

  function handleCountryChange(value: string) {
    const nextCountry = customerConfig.supportedCountries.find((country) => country.value === value);
    setBusinessForm((current) => ({
      ...current,
      country: value,
      currency: nextCountry?.currency || current.currency,
      bankName: "",
      paymentCode: "",
      ifsc: nextCountry?.value === "INDIA" ? current.ifsc : "",
      ibanNumber: nextCountry?.value === "UNITED ARAB EMIRATES" ? current.ibanNumber : "",
    }));
  }

  function selectBank(bank: BankMaster) {
    if (bankLinkCustomer) {
      setBankLinkForm((current) => ({
        ...current,
        bankName: bank.name,
        paymentCode: bank.paymentCode || current.paymentCode,
      }));
    } else if (customerMode === "individual") {
      setIndividualForm((current) => ({
        ...current,
        bankName: bank.name,
        paymentCode: bank.paymentCode || current.paymentCode,
      }));
    } else {
      setBusinessForm((current) => ({
        ...current,
        bankName: bank.name,
        paymentCode: bank.paymentCode || current.paymentCode,
      }));
    }
    setBankPopoverOpen(false);
    setBankSearch("");
  }

  function updateBankLinkField(field: keyof ReturnType<typeof createEmptyBankLinkForm>, value: string) {
    const cleanValue = field === "postCode" && typeof value === "string" ? value.replace(/\D/g, "") : value;
    setBankLinkForm((current) => ({ ...current, [field]: cleanValue }));
  }

  function updateOrderField(field: keyof ReturnType<typeof createEmptyOrderForm>, value: string | boolean) {
    setOrderForm((current) => ({ ...current, [field]: value }));
    setOrderDepositPreview(null);
    setOrderBalancePreview(null);
    setCreatedOrder(null);
  }

  function closeActionMenu() {
    setOpenActionMenuId(null);
    setActionMenuPosition(null);
  }

  function isIndividualKycVerified(customer: SubUser) {
    const type = (customer.type || "").toLowerCase();
    const statusValue = (customer.details?.kyc_status || "").toUpperCase();
    return (
      type === "individual" &&
      (customer.details?.kyc_verified ||
        ["COMPLETE", "COMPLETED", "BASIC", "BASIC_KYC_COMPLETED", "INTERMEDIATE_KYC_COMPLETED", "ADVANCE_KYC_COMPLETED", "EDD_COMPLETED"].includes(statusValue))
    );
  }

  function getDefaultOnmetaBank(customer: SubUser) {
    return (customer.details?.bank_accounts || []).find((account) => {
      const provider = (account.provider || "").toLowerCase();
      const status = (account.link_status || account.recipient_status || "").toUpperCase();
      return provider === "onmeta" && (!status || ["SUCCESS", "ACTIVE", "VERIFIED"].includes(status));
    }) || null;
  }

  function canCreateLocalOrder(customer: SubUser) {
    return isIndividualKycVerified(customer) && Boolean(getDefaultOnmetaBank(customer));
  }

  function openBankLinkModal(customer: SubUser) {
    const latestApiKey =
      typeof window !== "undefined"
        ? availableApiKey || window.sessionStorage.getItem("tenant-dashboard:latest-api-key") || ""
        : "";
    setSubmitError("");
    setBankPopoverOpen(false);
    setBankSearch("");
    setOpenActionMenuId(null);
    setActionMenuPosition(null);
    setBankLinkForm({
      ...createEmptyBankLinkForm(),
      apiKey: latestApiKey,
      email: customer.email,
      name: customer.name || customer.details?.business_name || customer.email.split("@")[0],
      accountName: customer.name || customer.email.split("@")[0],
    });
    setBankLinkCustomer(customer);
  }

  function openOrderModal(customer: SubUser) {
    const latestApiKey =
      typeof window !== "undefined"
        ? availableApiKey || window.sessionStorage.getItem("tenant-dashboard:latest-api-key") || ""
        : "";
    const bank = getDefaultOnmetaBank(customer);

    setSubmitError("");
    setSubmitSuccess("");
    setCreatedOrder(null);
    setOrderDepositPreview(null);
    setOrderBalancePreview(null);
    setOrderBalanceRefreshLocked(false);
    setOpenActionMenuId(null);
    setActionMenuPosition(null);
    setOrderForm({
      ...createEmptyOrderForm(),
      apiKey: latestApiKey,
      email: customer.email,
      accountNumber: bank?.account_number_masked || "",
      ifsc: bank?.ifsc || "",
      isNRI: Boolean(customer.details?.is_nri),
    });
    setOrderCustomer(customer);
  }

  function toggleActionMenu(customer: SubUser, button: HTMLButtonElement) {
    if (openActionMenuId === customer.id) {
      closeActionMenu();
      return;
    }

    const rect = button.getBoundingClientRect();
    const menuWidth = 160;
    setOpenActionMenuId(customer.id);
    setActionMenuPosition({
      top: Math.min(window.innerHeight - 12, rect.bottom + 8),
      left: Math.min(window.innerWidth - menuWidth - 12, Math.max(12, rect.right - menuWidth)),
    });
  }

  function closeTopOverlay() {
    if (orderCustomer) {
      closeOrderModal();
      return;
    }
    if (bankLinkCustomer) {
      closeBankLinkModal();
      return;
    }
    if (selectedCustomer) {
      setSelectedCustomer(null);
      return;
    }
    if (showCreateCustomer) {
      closeCreateModal();
      return;
    }
    if (openActionMenuId) {
      closeActionMenu();
    }
  }

  function closeBankLinkModal() {
    setBankLinkCustomer(null);
    setBankLinkVisible(false);
    setSubmitting(false);
    setSubmitError("");
    setBankPopoverOpen(false);
    setBankSearch("");
  }

  function closeOrderModal() {
    setOrderCustomer(null);
    setOrderVisible(false);
    setSubmitting(false);
    setSubmitError("");
    setOrderDepositPreview(null);
    setOrderBalancePreview(null);
    setOrderBalanceLoading(false);
    setOrderBalanceRefreshLocked(false);
    setCreatedOrder(null);
  }

  function resizePersonEntries<T extends PersonFileEntry | UboEntry>(
    count: number,
    current: T[],
    createEntry: () => T
  ) {
    if (current.length === count) return current;
    if (current.length > count) return current.slice(0, count);
    return [...current, ...Array.from({ length: count - current.length }, createEntry)];
  }

  function updateRepresentativeEntry(index: number, patch: Partial<PersonFileEntry>) {
    setRepresentativeEntries((current) =>
      current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, ...patch } : entry))
    );
  }

  function updateDirectorEntry(index: number, patch: Partial<PersonFileEntry>) {
    setDirectorEntries((current) =>
      current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, ...patch } : entry))
    );
  }

  function updateUboEntry(index: number, patch: Partial<UboEntry>) {
    setUboEntries((current) =>
      current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, ...patch } : entry))
    );
  }

  useEffect(() => {
    setRepresentativeEntries((current) =>
      resizePersonEntries(representativeCount, current, () => ({
        file: null,
        reuseRole: "",
        reuseIndex: "",
      }))
    );
  }, [representativeCount]);

  useEffect(() => {
    setDirectorEntries((current) =>
      resizePersonEntries(directorCount, current, () => ({
        file: null,
        reuseRole: "",
        reuseIndex: "",
      }))
    );
  }, [directorCount]);

  useEffect(() => {
    setUboEntries((current) =>
      resizePersonEntries(uboCount, current, () => ({
        frontFile: null,
        backFile: null,
        phone: "",
        reuseRole: "",
        reuseIndex: "",
      }))
    );
  }, [uboCount]);

  function getRepresentativeFile(index: number) {
    return representativeEntries[index]?.file || null;
  }

  function getDirectorFile(index: number) {
    const entry = directorEntries[index];
    if (!entry) return null;
    if (entry.reuseRole === "representative" && entry.reuseIndex) {
      return getRepresentativeFile(Number(entry.reuseIndex));
    }
    if (entry.reuseRole === "director" && entry.reuseIndex) {
      return directorEntries[Number(entry.reuseIndex)]?.file || null;
    }
    return entry.file || null;
  }

  function getUboFrontBack(index: number) {
    const entry = uboEntries[index];
    if (!entry) return { front: null, back: null };
    if (!entry.reuseRole) {
      return { front: entry.frontFile || null, back: entry.backFile || null };
    }
    if (entry.reuseRole === "representative" && entry.reuseIndex) {
      const file = getRepresentativeFile(Number(entry.reuseIndex));
      return { front: file, back: file };
    }
    if (entry.reuseRole === "director" && entry.reuseIndex) {
      const file = getDirectorFile(Number(entry.reuseIndex));
      return { front: file, back: file };
    }
    if (entry.reuseRole === "ubo" && entry.reuseIndex) {
      const source = uboEntries[Number(entry.reuseIndex)];
      return {
        front: source?.frontFile || null,
        back: source?.backFile || null,
      };
    }
    return { front: null, back: null };
  }

  function getReuseOptions(role: "director" | "ubo") {
    const repOptions = representativeEntries.map((_, index) => ({
      value: `representative:${index}`,
      label: `Representative ${index + 1}`,
    }));
    const directorOptions =
      role === "ubo"
        ? directorEntries.map((_, index) => ({
          value: `director:${index}`,
          label: `Director ${index + 1}`,
        }))
        : [];
    const uboOptions =
      role === "ubo"
        ? uboEntries.map((_, index) => ({
          value: `ubo:${index}`,
          label: `UBO ${index + 1}`,
        }))
        : [];
    return [...repOptions, ...directorOptions, ...uboOptions];
  }

  async function handleCreateRecipient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    try {
      const formData = new FormData();
      formData.append("step", "create");
      formData.append("apiKey", businessForm.apiKey);
      formData.append(
        "payload",
        JSON.stringify({
          email: businessForm.email,
          name: businessForm.businessName,
          recipientType: "Business",
          address: businessForm.address,
          city: businessForm.city,
          postCode: businessForm.postCode,
          reference: businessForm.reference || businessForm.contactName,
          bank: {
            accountName: businessForm.accountName,
            currency: businessForm.currency,
            country: businessForm.country,
            accountNumber: businessForm.accountNumber,
            paymentCode: businessForm.paymentCode,
            bankName: businessForm.bankName,
            ifsc: businessForm.ifsc || undefined,
            ibanNumber: businessForm.ibanNumber || undefined,
            accountType: businessForm.accountType || undefined,
          },
        })
      );

      const response = await fetch("/api/customers/business", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : JSON.stringify(data.error || data.data?.errors || "Recipient creation failed")
        );
      }

      setCreatedRecipient(data.data);
      setSubmitSuccess("Business customer created successfully.");

      try {
        const customerRes = await createCustomer({
          email: businessForm.email,
          profileType: "business",
          country: businessForm.country || "IN",
          corridor: "global",
        });
        const cId = customerRes?.customer_id || customerRes?.id || customerRes?.data?.customer_id || customerRes?.data?.id;

      } catch (err) {
        console.error("createCustomer endpoint error:", err);
      }

      closeCreateModal();
      const usersRes = await GetTenantUsers(users.page_number);
      setUsers(usersRes);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Recipient creation failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitKyb(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    try {
      const formData = new FormData();
      formData.append("step", "kyb");
      formData.append("apiKey", businessForm.apiKey);
      formData.append("email", businessForm.email);
      if (businessForm.uboPhoneNumber) {
        formData.append("uboPhoneNumber", businessForm.uboPhoneNumber);
      }

      if (!cinFile) {
        throw new Error("CIN/GSTIN/Business PAN file is required");
      }
      formData.append("cinOrGstinOrBPan", cinFile);

      const repFiles = representativeEntries.map((_, index) => getRepresentativeFile(index));
      const dirFiles = directorEntries.map((_, index) => getDirectorFile(index));
      const uboFiles = uboEntries.map((_, index) => getUboFrontBack(index));
      const uboPhones = uboEntries.map((entry) => entry.phone.trim()).filter(Boolean);

      if (repFiles.filter(Boolean).length < 1) throw new Error("At least 1 business representative PAN is required");
      if (dirFiles.filter(Boolean).length < 2) throw new Error("At least 2 business director PAN files are required");
      if (uboFiles.filter((entry) => entry.front && entry.back).length < 1) {
        throw new Error("At least 1 matched UBO PAN front/back pair is required");
      }
      if (uboPhones.length) {
        formData.append("uboPhoneNumber", uboPhones.join(", "));
      }

      repFiles.forEach((file, index) => {
        if (file) formData.append(`businessRepresentativePan${index + 1}`, file);
      });
      dirFiles.forEach((file, index) => {
        if (file) formData.append(`businessDirectorPan${index + 1}`, file);
      });
      uboFiles.forEach((entry, index) => {
        if (entry.front) formData.append(`uboPanFront${index + 1}`, entry.front);
        if (entry.back) formData.append(`uboPanBack${index + 1}`, entry.back);
      });

      const response = await fetch("/api/customers/business", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : JSON.stringify(data.error || data.data?.errors || "KYB upload failed")
        );
      }

      setSubmitSuccess("Business recipient created and KYB documents submitted.");
      closeCreateModal();
      const usersRes = await GetTenantUsers(users.page_number);
      setUsers(usersRes);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "KYB upload failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitIndividualKyc(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    try {
      const formData = new FormData();
      formData.append("apiKey", individualForm.apiKey);
      formData.append("step", individualKycType === "nri" ? "nri-kyc" : "regular-kyc");
      formData.append("email", individualForm.email);
      formData.append("profession", individualForm.profession);

      if (individualKycType === "regular") {
        formData.append("firstName", individualForm.firstName);
        formData.append("lastName", individualForm.lastName);
        formData.append("panNumber", individualForm.panNumber);
        formData.append("aadharNumber", individualForm.aadharNumber);
        formData.append("incomeRange", individualForm.incomeRange);
        formData.append("phone", individualForm.phone);
        formData.append("countryCode", individualForm.countryCode);
        formData.append("dob", individualForm.dob);

        Object.entries(regularKycFiles).forEach(([key, file]) => {
          if (file) formData.append(key, file);
        });
      } else {
        const hasNriDocument = NRI_DOCUMENT_FIELDS.some((field) => Boolean(nriKycFiles[field]));
        const hasNriDocumentNumber = Boolean(
          individualForm.drivingLicenseNumber.trim() ||
          individualForm.workVisaNumber.trim() ||
          individualForm.emiratesIdNumber.trim()
        );
        if (!hasNriDocument && !hasNriDocumentNumber) {
          throw new Error("Upload one NRI photo ID or enter one document number: Driving License, Work Visa, or Emirates ID.");
        }

        formData.append("name", individualForm.fullName);
        formData.append("dob", individualForm.dob);
        formData.append("income_range", individualForm.incomeRange);
        formData.append("address[pin]", individualForm.postCode);
        formData.append("address[state]", individualForm.state);
        formData.append("address[city]", individualForm.city);
        formData.append("address[locality]", individualForm.locality);
        if (individualForm.district) formData.append("address[district]", individualForm.district);
        if (individualForm.landmark) formData.append("address[landmark]", individualForm.landmark);
        if (individualForm.drivingLicenseNumber.trim()) formData.append("drivingLicenseNumber", individualForm.drivingLicenseNumber.trim());
        if (individualForm.workVisaNumber.trim()) formData.append("workVisaNumber", individualForm.workVisaNumber.trim());
        if (individualForm.emiratesIdNumber.trim()) formData.append("emiratesIdNumber", individualForm.emiratesIdNumber.trim());

        Object.entries(nriKycFiles).forEach(([key, file]) => {
          if (file) formData.append(key, file);
        });
      }

      const response = await fetch("/api/customers/individual", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : JSON.stringify(data.error || data.data?.errors || "KYC upload failed")
        );
      }

      const successMessage =
        typeof data?.data?.message === "string" && data.data.message.trim()
          ? data.data.message
          : "KYC submitted successfully. You can continue with bank linking.";
      setSubmitSuccess(successMessage);

      try {
        const customerRes = await createCustomer({
          email: individualForm.email,
          profileType: "individual",
          country: individualForm.country || "IN",
          corridor: "global",
        });
        const cId = customerRes?.customer_id || customerRes?.id || customerRes?.data?.customer_id || customerRes?.data?.id;

      } catch (err) {
        console.error("createCustomer endpoint error:", err);
      }

      setCurrentStep(2);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "KYC upload failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLinkIndividualBank(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    try {
      const fullName = bankLinkForm.name || bankLinkForm.accountName;
      const isNriCustomer = Boolean(bankLinkCustomer?.details?.is_nri);
      const payload: Record<string, unknown> = {
        email: bankLinkForm.email,
        name: fullName,
        kycVerified: true,
        bankDetails: {
          accountNumber: bankLinkForm.accountNumber,
          accountName: bankLinkForm.accountName,
          ifsc: bankLinkForm.ifsc,
          branchAddress: bankLinkForm.branchAddress,
        },
        recipientType: "Individual",
        paymentCode: bankLinkForm.paymentCode,
        accountType: bankLinkForm.accountType,
        bankName: bankLinkForm.bankName,
        reference: bankLinkForm.reference || fullName,
      };
      if (!isNriCustomer) {
        payload.address = bankLinkForm.address;
        payload.city = bankLinkForm.city;
        payload.postCode = bankLinkForm.postCode;
      }
      const formData = new FormData();
      formData.append("step", "link-bank");
      formData.append("apiKey", bankLinkForm.apiKey);
      formData.append(
        "payload",
        JSON.stringify(payload)
      );

      const response = await fetch("/api/customers/individual", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : JSON.stringify(data.error || data.data?.errors || "Bank linking failed")
        );
      }

      setSubmitSuccess("Individual bank account linked.");
      closeBankLinkModal();
      const usersRes = await GetTenantUsers(users.page_number);
      setUsers(usersRes);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Bank linking failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePreviewLocalOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setCreatedOrder(null);
    setOrderBalancePreview(null);

    try {
      const response = await fetch("/api/customers/individual/order/deposit-address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: orderForm.apiKey,
          email: orderForm.email,
          chainId: orderForm.chainId,
          sellTokenSymbol: orderForm.sellTokenSymbol,
        }),
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : JSON.stringify(data.error || data.data?.errors || "Deposit address lookup failed")
        );
      }

      setOrderDepositPreview(data.data);
      setSubmitSuccess("");
      await fetchOrderBalance({ force: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Deposit address lookup failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function fetchOrderBalance({ force = false }: { force?: boolean } = {}) {
    if (orderBalanceRefreshLocked && !force) return;

    setOrderBalanceLoading(true);
    setSubmitError("");
    setOrderBalanceRefreshLocked(true);
    window.setTimeout(() => setOrderBalanceRefreshLocked(false), 10_000);

    try {
      const response = await fetch("/api/customers/individual/order/balance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: orderForm.apiKey,
          email: orderForm.email,
          chainId: orderForm.chainId,
          sellTokenSymbol: orderForm.sellTokenSymbol,
          sellTokenAmount: orderForm.sellTokenAmount,
        }),
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : JSON.stringify(data.error || data.data?.errors || "Balance lookup failed")
        );
      }

      setOrderBalancePreview(data.data);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Balance lookup failed");
    } finally {
      setOrderBalanceLoading(false);
    }
  }

  async function handleCreateLocalOrder() {
    if (!orderBalancePreview?.balanceSufficient) {
      setSubmitError("Wallet balance is not enough for this order amount. Refresh after the deposit is confirmed.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    setCreatedOrder(null);

    try {
      const response = await fetch("/api/customers/individual/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderForm),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : JSON.stringify(data.error || data.data?.errors || "Offramp order creation failed")
        );
      }

      setCreatedOrder(data.data);
      setSubmitSuccess("Local order created.");
      const usersRes = await GetTenantUsers(users.page_number);
      setUsers(usersRes);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Offramp order creation failed");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      closeTopOverlay();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  });

  useEffect(() => {
    if (!openActionMenuId) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-customer-action-menu]") || target?.closest("[data-customer-action-trigger]")) {
        return;
      }
      closeActionMenu();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", closeActionMenu);
    window.addEventListener("scroll", closeActionMenu, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", closeActionMenu);
      window.removeEventListener("scroll", closeActionMenu, true);
    };
  }, [openActionMenuId]);

  if (loading) {
    return (
      <DashboardShell active="Customers">
        <div className="flex min-h-[320px] w-full items-center justify-center" aria-label="Loading customers">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ebebeb] border-t-[#0f172a]" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <div className="flex w-full min-h-screen min-w-0 overflow-x-hidden bg-[var(--color-shell)]">
      <Sidebar active="Customers" />

      <div className="flex min-w-0 flex-col flex-1 gap-3 p-2 sm:p-3 bg-[var(--color-shell)]">
        <TopBar />

        <main className="flex min-w-0 w-full flex-col gap-8 sm:gap-[52px] items-center bg-[var(--color-surface)] rounded-[24px] sm:rounded-[28px] px-3 sm:px-4 md:px-6 lg:px-[212px] py-4 sm:py-6 flex-1 border border-[var(--color-stroke)] overflow-x-hidden shell-enter">
          <div className="flex min-w-0 flex-col gap-6 sm:gap-8 w-full max-w-[1264px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-1.5 bg-[var(--color-input)] h-9 px-3 rounded-xl w-full sm:max-w-[325px]">
                <Search size={16} className="text-[#64748b] shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search customers by name, email, ID..."
                  className="bg-transparent text-xs text-[#0f172a] placeholder:text-[#64748b] outline-none w-full"
                />
              </div>
              <div className="flex h-9 w-full min-w-0 items-center gap-1.5 rounded-xl border border-[var(--color-stroke)] bg-[var(--color-surface)] px-3 sm:max-w-[380px]">
                <Key size={15} className="shrink-0 text-[#64748b]" />
                <input
                  type="password"
                  value={inputApiKey}
                  onChange={(event) => {
                    setInputApiKey(event.target.value);
                    setSubmitError("");
                  }}
                  placeholder="Set tenant API key"
                  aria-label="Tenant API key"
                  className="min-w-0 flex-1 bg-transparent text-xs text-[#0f172a] outline-none placeholder:text-[#64748b]"
                />
                {inputApiKey.trim() !== availableApiKey.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      if (inputApiKey.trim()) {
                        applyTenantApiKey(inputApiKey.trim());
                        toast({ title: "Tenant API Key saved successfully" });
                      }
                    }}
                    disabled={!inputApiKey.trim()}
                    className="shrink-0 cursor-pointer rounded-lg bg-[#0f172a] px-2.5 py-1 text-[11px] font-medium text-white hover:bg-[#1e293b] disabled:opacity-50 transition-colors"
                  >
                    Save
                  </button>
                )}
                {availableApiKey ? (
                  <button
                    type="button"
                    onClick={() => {
                      applyTenantApiKey("");
                      setInputApiKey("");
                    }}
                    className="shrink-0 rounded-md px-1.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748b] hover:bg-[#f8fafc]"
                  >
                    Clear
                  </button>
                ) : null}
              </div>
              <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
                {availableApiKey ? (
                  <Link
                    href="/seismic"
                    className="flex items-center justify-center gap-1.5 w-full sm:w-auto bg-[#0f172a] border border-[#0f172a] px-3 py-2 rounded-[31px] text-xs font-medium text-white hover:bg-[#1e293b] transition-colors"
                  >
                    <Plus size={16} />
                    Create Customer
                  </Link>
                ) : (
                  <button
                    disabled
                    title="Set a tenant API key first"
                    className="flex items-center justify-center gap-1.5 w-full sm:w-auto bg-[#0f172a] border border-[#0f172a] px-3 py-2 rounded-[31px] text-xs font-medium text-white opacity-40 cursor-not-allowed"
                  >
                    <Plus size={16} />
                    Create Customer
                  </button>
                )}
                <button
                  onClick={handleExportCSV}
                  className="flex items-center justify-center gap-1.5 w-full sm:w-auto bg-[var(--color-surface)] border border-[var(--color-stroke)] px-3 py-2 rounded-[31px] text-xs font-medium text-[#0f172a] hover:bg-[var(--color-card)] transition-colors"
                >
                  <Download size={16} />
                  Export CSV
                </button>
              </div>
            </div>

            {submitSuccess ? (
              <div className="rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#166534]">
                {submitSuccess}
              </div>
            ) : null}
            {submitError && !showCreateCustomer && !selectedCustomer && !bankLinkCustomer && !orderCustomer ? (
              <div className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">
                {submitError}
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <StatCard title="Total Customers" value={query ? filteredUsers.length : tenantStats?.total_customers ?? 0} />
              <StatCard
                title="Active Customers"
                value={query ? filteredUsers.filter((user) => user.is_active).length : tenantStats?.active_customers ?? 0}
              />
              <StatCard title="Total Remitted Volume" value={`$${totalRevenue.toFixed(2)}`} />
            </div>
            
            <div className="flex flex-col gap-4 rounded-[24px] border border-[var(--color-stroke)] w-full shadow-xs">
              <div className="flex items-center justify-between gap-4 px-6 pt-6">
                <div className="flex items-center gap-3">
                  <p className="text-lg font-semibold leading-6 text-[#0f172a] whitespace-nowrap">
                    Customers
                  </p>
                  {availableApiKey.trim() ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200/60">
                      <Key size={11} /> API Key Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white text-black text-[11px] font-medium border border-amber-200/60">
                      <Key size={11} /> Key Required
                    </span>
                  )}
                </div>
              </div>
                  <div className='min-h-[300px] w-full p-4'>

                    {!availableApiKey.trim() && (
                      <div className="flex flex-col items-center justify-center min-h-[280px] w-full py-12 px-4 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                        <div className="size-12 rounded-2xl bg-white text-black flex items-center justify-center mb-3.5 shadow-xs ring-4 ring-amber-50/60">
                          <Key className="size-6" />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                          Tenant API Key Required
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
                          Please enter and save your tenant API key above to load customer records and manage workflows.
                        </p>
                      </div>
                    )}

                    {availableApiKey.trim()&& (
                    <div>
                      <div className="">
                        <div className="flex flex-col bg-[var(--color-table)] border border-[var(--color-stroke-strong)] rounded-[18px] overflow-hidden">
                          <div className="grid grid-cols-[1.4fr_1.8fr_1fr_1.2fr_1fr_1.3fr_40px] items-center gap-3 px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#8a94a6] bg-[var(--color-table-header)] border-b border-[var(--color-stroke-strong)]">
                            <span className="truncate">Customer Name</span>
                            <span className="truncate">Email</span>
                            <span className="truncate">Volume</span>
                            <span className="truncate">Type</span>
                            <span className="truncate">Status</span>
                            <span className="truncate">Offramp V2</span>
                            <span className="text-center">More</span>
                          </div>


                        
                          {loading ? (
                            <div className="flex flex-col divide-y divide-slate-100">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={`skeleton-${i}`}
                                  className="grid grid-cols-[1.4fr_1.8fr_1fr_1.2fr_1fr_1.3fr_40px] items-center gap-3 px-5 py-3.5 animate-pulse"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="size-7 rounded-full bg-slate-200 shrink-0" />
                                    <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                                  </div>
                                  <div className="h-4 bg-slate-200 rounded-md w-5/6" />
                                  <div className="h-4 bg-slate-200 rounded-md w-1/2" />
                                  <div className="h-4 bg-slate-200 rounded-md w-2/3" />
                                  <div className="h-6 bg-slate-200 rounded-full w-16" />
                                  <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                                  <div className="size-6 bg-slate-200 rounded-lg justify-self-center" />
                                </div>
                              ))}
                            </div>
                          ) : filteredUsers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                              <div className="p-3.5 rounded-full bg-slate-100 text-slate-400 mb-3">
                                <Users size={24} />
                              </div>
                              <p className="text-sm font-medium text-slate-700">
                                {query ? "No customers match this search" : "No customers found"}
                              </p>
                              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                                {query ? "Try adjusting your search query" : "Get started by adding your first customer to the tenant dashboard."}
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col divide-y divide-slate-100">
                              {filteredUsers.map((row) => {
                                const displayName = row.details?.business_name || row.name || row.email.split("@")[0];
                                const initial = (displayName[0] || "C").toUpperCase();
                                const typeLabel = customerTypeLabel(
                                  row,
                                  offrampCustomersByEmail[row.email] || offrampCustomersByEmail[row.email?.toLowerCase()] || []
                                );
                                const offrampLabel = offrampVerificationLabel(
                                  row,
                                  offrampCustomersByEmail[row.email] || offrampCustomersByEmail[row.email?.toLowerCase()] || []
                                );

                                return (
                                  <div
                                    key={row.id}
                                    className="grid grid-cols-[1.4fr_1.8fr_1fr_1.2fr_1fr_1.3fr_40px] items-center gap-3 px-5 py-3 hover:bg-slate-50/80 transition-colors text-sm"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <span className="font-medium text-[#0f172a] truncate" title={displayName}>
                                        {displayName}
                                      </span>
                                    </div>

                                    <span className="font-medium text-[#0f172a] truncate" title={row.email}>
                                      {row.email}
                                    </span>

                                    <span className="font-medium text-[#0f172a]">
                                      ${row.volume?.toFixed(2) ?? "0.00"}
                                    </span>

                                    <span className="font-medium text-[#0f172a] capitalize truncate">
                                      {typeLabel}
                                    </span>

                                    <div>
                                      <StatusBadge customer={row} />
                                    </div>

                                    <span
                                      className="truncate text-xs font-medium text-[#475569]"
                                      title={offrampLabel}
                                    >
                                      {offrampLabel}
                                    </span>

                                    <div className="relative flex justify-center">
                                      <button
                                        data-customer-action-trigger
                                        onClick={(event) => toggleActionMenu(row, event.currentTarget)}
                                        className="flex h-7 w-7 items-center cursor-pointer justify-center rounded-lg hover:bg-[#eef2f7] transition-colors"
                                        aria-label="Open customer actions"
                                      >
                                        <MoreHorizontal size={20} className="text-[#64748b]" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/*Pagination Part */}
                      <div className="flex items-center justify-between pt-6 px-6 pb-4 flex-wrap gap-4">
                        <div className="flex items-center gap-3 rounded-[31px] flex-wrap">
                          <span className="text-xs font-medium text-[#0f172a] whitespace-nowrap">Rows per page</span>
                          <div className="flex items-center gap-1 bg-[var(--color-surface)] border border-[var(--color-stroke)] h-8 pl-3 pr-1.5 py-3 rounded-xl">
                            <span className="text-xs font-medium text-[#0f172a] whitespace-nowrap">{users.per_page}</span>
                            <ChevronLeft size={16} className="text-[#0f172a] rotate-[-90deg]" />
                          </div>
                          <span className="text-xs font-medium text-[#0f172a] whitespace-nowrap">
                            {filteredUsers.length > 0
                              ? `${(users.page_number - 1) * users.per_page + 1}-${(users.page_number - 1) * users.per_page + filteredUsers.length} of ${query ? filteredUsers.length : users.count}`
                              : "0 of 0"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 rounded-[31px] self-end sm:self-auto">
                          <button
                            onClick={() => handlePageChange(users.page_number - 1)}
                            disabled={!users.previous}
                            className="flex items-center justify-center bg-[var(--color-surface)] border border-[var(--color-stroke)] h-8 px-1.5 rounded-xl disabled:opacity-40"
                          >
                            <ChevronLeft size={24} className="text-[#0f172a]" />
                          </button>
                          {getPages().map((p, i) =>
                            typeof p === "string" ? (
                              <span key={`dots-${i}`} className="flex items-center justify-center size-8 text-xs text-[#0f172a]">...</span>
                            ) : (
                              <button
                                key={p}
                                onClick={() => handlePageChange(p)}
                                className={`flex items-center justify-center size-8 rounded-[44px] text-xs font-medium ${p === users.page_number ? "bg-[#0f172a] text-white" : "text-[#0f172a] hover:bg-[#eef2f7]"
                                  }`}
                              >
                                {p}
                              </button>
                            )
                          )}
                          <button
                            onClick={() => handlePageChange(users.page_number + 1)}
                            disabled={!users.next}
                            className="flex items-center justify-center bg-[var(--color-surface)] border border-[var(--color-stroke)] h-8 px-1.5 rounded-xl disabled:opacity-40"
                          >
                            <ChevronRight size={24} className="text-[#0f172a]" />
                          </button>
                        </div>
                      </div>
                    </div>
                    )}   
                </div>
            </div>
          </div>
        </main>
      </div>

      {actionMenuCustomer && actionMenuPosition ? (
        <div
          data-customer-action-menu
          className="fixed z-[60] w-40 overflow-hidden rounded-xl border border-[var(--color-stroke)] bg-white py-1 shadow-[0_18px_45px_rgba(15,23,42,0.12)]"
          style={{ top: actionMenuPosition.top, left: actionMenuPosition.left }}
        >
          <button
            type="button"
            onClick={() => {
              setSelectedCustomer(actionMenuCustomer);
              setOpenActionMenuId(null);
              setActionMenuPosition(null);
            }}
            className="w-full px-3 py-2 text-left text-sm text-[#0f172a] hover:bg-[#f8fafc]"
          >
            View details
          </button>
          <button
            type="button"
            onClick={() => {
              openKycModalForCustomer(actionMenuCustomer);
              closeActionMenu();
            }}
            className="w-full px-3 py-2 text-left text-sm text-[#0f172a] hover:bg-[#f8fafc]"
          >
            {(actionMenuCustomer.profile_type || "").toLowerCase().includes("business")
              ? "Resume KYB"
              : "Resume KYC"}
          </button>
          <Link
            href={`/customers/${actionMenuCustomer.id}/virtual-accounts?email=${encodeURIComponent(actionMenuCustomer.email)}`}
            onClick={closeActionMenu}
            className="block w-full px-3 py-2 text-left text-sm text-[#0f172a] hover:bg-[#f8fafc]"
          >
            Virtual accounts
          </Link>
          {isIndividualKycVerified(actionMenuCustomer) ? (
            <button
              type="button"
              onClick={() => openBankLinkModal(actionMenuCustomer)}
              className="w-full px-3 py-2 text-left text-sm text-[#0f172a] hover:bg-[#f8fafc]"
            >
              Link bank
            </button>
          ) : null}
          {canCreateLocalOrder(actionMenuCustomer) ? (
            <button
              type="button"
              onClick={() => openOrderModal(actionMenuCustomer)}
              className="w-full px-3 py-2 text-left text-sm text-[#0f172a] hover:bg-[#f8fafc]"
            >
              Create order
            </button>
          ) : null}
          {(actionMenuCustomer.type || "").toLowerCase() === "individual" ? (
            <button
              type="button"
              onClick={() => handleRefreshCustomerKyc(actionMenuCustomer)}
              disabled={refreshingKycCustomerId === actionMenuCustomer.id}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#0f172a] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshingKycCustomerId === actionMenuCustomer.id ? (
                <Loader2 size={14} className="animate-spin text-[#64748b]" />
              ) : (
                <RefreshCw size={14} className="text-[#64748b]" />
              )}
              Refresh KYC
            </button>
          ) : null}
        </div>
      ) : null}

      {showCreateCustomer ? (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden px-3 py-3 transition-[background-color] duration-200 sm:px-6 sm:py-6 ${createCustomerVisible ? "bg-[#0f172a]/35" : "bg-[#0f172a]/0"
            }`}
        >
          <div className="mx-auto flex h-full w-full max-w-5xl items-center justify-center">
            <div
              className={`flex max-h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-[var(--color-stroke)] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] transition-all duration-200 ease-out sm:rounded-[24px] ${createCustomerVisible
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-4 scale-[0.985]"
                }`}
            >
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--color-stroke)] px-5 py-4 sm:px-6">
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold text-[#0f172a]">Create Customer</h2>
                  <p className="mt-1 max-w-2xl text-sm text-[#64748b]">
                    {customerMode === "business"
                      ? "Business customer via API-key offramp flow. Step 1 creates recipient. Step 2 uploads KYB docs."
                      : "Individual customer via local offramp KYC."}
                  </p>
                </div>
                <button
                  onClick={closeCreateModal}
                  className="rounded-xl p-2 hover:bg-[#f8fafc]"
                  aria-label="Close create customer dialog"
                >
                  <X size={18} className="text-[#64748b]" />
                </button>
              </div>

              <div className="shrink-0 border-b border-[var(--color-stroke)] px-5 py-3 sm:px-6">
                <div className="flex flex-col gap-3">
                  <div className="grid w-full grid-cols-2 rounded-xl border border-[var(--color-stroke)] bg-[#f8fafc] p-1 sm:flex sm:w-fit">
                    {(["business", "individual"] as CustomerMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setCustomerMode(mode);
                          setCurrentStep(1);
                          setSubmitError("");
                          setBankPopoverOpen(false);
                        }}
                        className={`h-9 rounded-lg px-4 text-sm font-medium capitalize ${customerMode === mode ? "bg-white text-[#0f172a] shadow-sm" : "text-[#64748b]"
                          }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                  {customerMode === "business" ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <div className={`rounded-full px-4 py-2 text-xs font-semibold ${currentStep === 1 ? "bg-[#0f172a] text-white" : "bg-[#eef2f7] text-[#64748b]"}`}>
                        1. Business Details
                      </div>
                      <div className={`rounded-full px-4 py-2 text-xs font-semibold ${currentStep === 2 ? "bg-[#0f172a] text-white" : "bg-[#eef2f7] text-[#64748b]"}`}>
                        2. KYB Documents
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="rounded-full bg-[#0f172a] px-4 py-2 text-xs font-semibold text-white">
                        Individual KYC
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
                {customerMode === "business" ? (
                  currentStep === 1 ? (
                    <form onSubmit={handleCreateRecipient} className="flex flex-col gap-5">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="md:col-span-2 rounded-2xl border border-[var(--color-stroke)] bg-[#f8fafc] px-4 py-3">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a94a6]">API Key</div>
                          <div className="mt-2 text-sm text-[#0f172a]">
                            {availableApiKey
                              ? "Using stored tenant API key from this session."
                              : "No stored tenant API key found in this session. Paste one below to continue."}
                          </div>
                        </div>
                        {!availableApiKey ? (
                          <Field label="API Key">
                            <input
                              required
                              value={businessForm.apiKey}
                              onChange={(e) => updateBusinessField("apiKey", e.target.value)}
                              placeholder="Paste tenant API key"
                              className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]"
                            />
                          </Field>
                        ) : null}
                        <Field label="Business Name">
                          <input
                            required
                            value={businessForm.businessName}
                            onChange={(e) => updateBusinessField("businessName", e.target.value)}
                            className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]"
                          />
                        </Field>
                        <Field label="Customer Email">
                          <input
                            required
                            type="email"
                            value={businessForm.email}
                            onChange={(e) => updateBusinessField("email", e.target.value)}
                            className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]"
                          />
                        </Field>
                        <Field label="Contact Name">
                          <input
                            value={businessForm.contactName}
                            onChange={(e) => updateBusinessField("contactName", e.target.value)}
                            className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]"
                          />
                        </Field>
                        <Field label="Address">
                          <input
                            required
                            value={businessForm.address}
                            onChange={(e) => updateBusinessField("address", e.target.value)}
                            className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]"
                          />
                        </Field>
                        <Field label="City">
                          <input
                            required
                            value={businessForm.city}
                            onChange={(e) => updateBusinessField("city", e.target.value)}
                            className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]"
                          />
                        </Field>
                        <Field label="Postal Code">
                          <input
                            required
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={businessForm.postCode}
                            onChange={(e) => updateBusinessField("postCode", e.target.value.replace(/\D/g, ""))}
                            className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]"
                          />
                        </Field>
                        <Field label="Reference">
                          <input
                            value={businessForm.reference}
                            onChange={(e) => updateBusinessField("reference", e.target.value)}
                            className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]"
                          />
                        </Field>
                        <Field label="Country">
                          <div className="flex h-11 w-full items-center rounded-xl border border-[var(--color-stroke)] bg-[#f8fafc] px-3 text-sm text-[#0f172a]">
                            {selectedCountry?.label || businessForm.country}
                          </div>
                        </Field>
                        <Field label="Currency">
                          <div className="flex h-11 w-full items-center rounded-xl border border-[var(--color-stroke)] bg-[#f8fafc] px-3 text-sm uppercase text-[#0f172a]">
                            {businessForm.currency}
                          </div>
                        </Field>
                        <Field label="Account Holder Name">
                          <input
                            required
                            value={businessForm.accountName}
                            onChange={(e) => updateBusinessField("accountName", e.target.value)}
                            className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]"
                          />
                        </Field>
                        <Field label="Account Number">
                          <input
                            required
                            value={businessForm.accountNumber}
                            onChange={(e) => updateBusinessField("accountNumber", e.target.value)}
                            className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]"
                          />
                        </Field>
                        <Field label="Bank Name">
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setBankPopoverOpen((current) => !current)}
                              className="flex h-11 w-full items-center justify-between rounded-xl border border-[var(--color-stroke)] px-3 text-sm text-[#0f172a] outline-none"
                            >
                              <span className={businessForm.bankName ? "truncate" : "text-[#64748b]"}>
                                {businessForm.bankName || (banksLoading ? "Loading banks..." : "Search & select bank")}
                              </span>
                              <ChevronsUpDown size={16} className="text-[#64748b] shrink-0" />
                            </button>
                            {bankPopoverOpen ? (
                              <div className="absolute left-0 top-12 z-30 w-full overflow-hidden rounded-2xl border border-[var(--color-stroke)] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                                <div className="border-b border-[var(--color-stroke)] p-2">
                                  <input
                                    value={bankSearch}
                                    onChange={(e) => setBankSearch(e.target.value)}
                                    placeholder="Search bank..."
                                    className="h-10 w-full rounded-xl bg-[#f8fafc] px-3 text-sm outline-none"
                                  />
                                </div>
                                <div className="max-h-[260px] overflow-y-auto py-1">
                                  {filteredBankMasters.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-[#64748b]">
                                      {banksLoading ? "Loading banks..." : "No bank found."}
                                    </div>
                                  ) : (
                                    filteredBankMasters.map((bank) => (
                                      <button
                                        type="button"
                                        key={bank._id || `${bank.paymentCode}-${bank.name}`}
                                        onClick={() => selectBank(bank)}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#f8fafc]"
                                      >
                                        <Check
                                          size={14}
                                          className={businessForm.bankName === bank.name ? "opacity-100 text-[#0f172a]" : "opacity-0"}
                                        />
                                        <span className="truncate">{bank.name}</span>
                                      </button>
                                    ))
                                  )}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </Field>
                        <input type="hidden" value={businessForm.paymentCode} readOnly />
                        {selectedCountry?.requiredBankFields.includes("ifsc") ? (
                          <Field label="IFSC">
                            <input
                              required
                              value={businessForm.ifsc}
                              onChange={(e) => updateBusinessField("ifsc", e.target.value)}
                              className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]"
                            />
                          </Field>
                        ) : null}
                        {selectedCountry?.requiredBankFields.includes("ibanNumber") ? (
                          <Field label="IBAN Number">
                            <input
                              required
                              value={businessForm.ibanNumber}
                              onChange={(e) => updateBusinessField("ibanNumber", e.target.value)}
                              className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]"
                            />
                          </Field>
                        ) : null}
                        <Field label="Account Type">
                          <select
                            value={businessForm.accountType}
                            onChange={(e) => updateBusinessField("accountType", e.target.value)}
                            className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]"
                          >
                            <option value="Checking">Checking</option>
                            <option value="Savings">Savings</option>
                          </select>
                        </Field>
                      </div>

                      {submitError ? (
                        <div className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c] break-words">
                          {submitError}
                        </div>
                      ) : null}

                      <div className="sticky bottom-0 -mx-5 mt-2 flex flex-wrap items-center justify-end gap-3 border-t border-[var(--color-stroke)] bg-white/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:px-6">
                        <button
                          type="button"
                          onClick={closeCreateModal}
                          className="rounded-full border border-[var(--color-stroke)] px-4 py-2 text-sm font-medium text-[#0f172a]"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting || !businessForm.apiKey.trim()}
                          className="inline-flex items-center gap-2 rounded-full bg-[#0f172a] px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
                        >
                          {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                          Continue to KYB
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleSubmitKyb} className="flex flex-col gap-6">
                      <div className="rounded-2xl border border-[#dbe4ff] bg-[#f8fbff] px-4 py-3 text-sm text-[#334155]">
                        Recipient created: <span className="font-medium text-[#0f172a]">{createdRecipient?.name || businessForm.businessName}</span>
                      </div>

                      <DocumentBlock title="CIN or GSTIN or Business PAN" description="Required. One file.">
                        <input
                          required
                          type="file"
                          onChange={(e) => setCinFile(e.target.files?.[0] || null)}
                          className="block w-full text-sm text-[#0f172a] file:mr-4 file:rounded-full file:border-0 file:bg-[#0f172a] file:px-4 file:py-2 file:text-xs file:font-medium file:text-white"
                        />
                      </DocumentBlock>

                      <CountSection
                        title="Business Representatives"
                        description="Pick how many representatives you need. Upload once per person."
                        count={representativeCount}
                        min={1}
                        max={7}
                        onChange={setRepresentativeCount}
                      />
                      <RoleUploadSection
                        title="Business Representative PAN"
                        entries={representativeEntries}
                        roleLabel="Representative"
                        onFileChange={(index, file) => updateRepresentativeEntry(index, { file })}
                      />

                      <CountSection
                        title="Business Directors"
                        description="Pick number of directors. If same person as a representative, reuse that upload."
                        count={directorCount}
                        min={2}
                        max={7}
                        onChange={setDirectorCount}
                      />
                      <RoleReuseSection
                        title="Business Director PAN"
                        roleLabel="Director"
                        entries={directorEntries}
                        reuseOptions={getReuseOptions("director")}
                        onEntryChange={updateDirectorEntry}
                      />

                      <CountSection
                        title="UBOs"
                        description="Pick number of UBOs. Each UBO gets a phone field. Reuse existing uploads where same person is already added."
                        count={uboCount}
                        min={1}
                        max={7}
                        onChange={setUboCount}
                      />
                      <UboSection
                        entries={uboEntries}
                        reuseOptions={getReuseOptions("ubo")}
                        onEntryChange={updateUboEntry}
                      />

                      {submitError ? (
                        <div className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c] break-words">
                          {submitError}
                        </div>
                      ) : null}

                      <div className="sticky bottom-0 -mx-5 mt-2 flex flex-wrap items-center justify-end gap-3 border-t border-[var(--color-stroke)] bg-white/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:px-6">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="rounded-full border border-[var(--color-stroke)] px-4 py-2 text-sm font-medium text-[#0f172a]"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={submitting || !businessForm.apiKey.trim()}
                          className="inline-flex items-center gap-2 rounded-full bg-[#0f172a] px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
                        >
                          {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                          Submit KYB
                        </button>
                      </div>
                    </form>
                  )
                ) : (
                  <form onSubmit={handleSubmitIndividualKyc} className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="md:col-span-2 rounded-2xl border border-[var(--color-stroke)] bg-[#f8fafc] px-4 py-3">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a94a6]">API Key</div>
                        <div className="mt-2 text-sm text-[#0f172a]">
                          {availableApiKey
                            ? "Using stored tenant API key from this session."
                            : "No stored tenant API key found in this session. Paste one below to continue."}
                        </div>
                      </div>
                      {!availableApiKey ? (
                        <Field label="API Key">
                          <input
                            required
                            value={individualForm.apiKey}
                            onChange={(e) => updateIndividualField("apiKey", e.target.value)}
                            placeholder="Paste tenant API key"
                            className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]"
                          />
                        </Field>
                      ) : null}
                      <Field label="KYC Type" required>
                        <select
                          value={individualKycType}
                          onChange={(e) => {
                            setIndividualKycType(e.target.value as IndividualKycType);
                            setSubmitError("");
                          }}
                          className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]"
                        >
                          <option value="regular">Regular Indian Individual</option>
                          <option value="nri">NRI</option>
                        </select>
                      </Field>
                      <Field label="Customer Email" required>
                        <input
                          required
                          type="email"
                          value={individualForm.email}
                          onChange={(e) => updateIndividualField("email", e.target.value)}
                          className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]"
                        />
                      </Field>
                      {individualKycType === "regular" ? (
                        <>
                          <Field label="First Name" required>
                            <input required value={individualForm.firstName} onChange={(e) => updateIndividualField("firstName", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                          </Field>
                          <Field label="Last Name" required>
                            <input required value={individualForm.lastName} onChange={(e) => updateIndividualField("lastName", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                          </Field>
                          <Field label="Date of Birth" required>
                            <input required type="date" value={individualForm.dob} onChange={(e) => updateIndividualField("dob", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                          </Field>
                          <Field label="PAN Number" required>
                            <input required value={individualForm.panNumber} onChange={(e) => updateIndividualField("panNumber", e.target.value.toUpperCase())} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm uppercase outline-none focus:border-[#0f172a]" />
                          </Field>
                          <Field label="Aadhaar Number" required>
                            <input required value={individualForm.aadharNumber} onChange={(e) => updateIndividualField("aadharNumber", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                          </Field>
                          <Field label="Income Range" required>
                            <select required value={individualForm.incomeRange} onChange={(e) => updateIndividualField("incomeRange", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]">
                              <option value="">Select income range</option>
                              {INCOME_RANGES.map((range) => <option key={range} value={range}>{range}</option>)}
                            </select>
                          </Field>
                          <Field label="Profession" required>
                            <input required value={individualForm.profession} onChange={(e) => updateIndividualField("profession", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                          </Field>
                          <Field label="Country Code" required>
                            <input required value={individualForm.countryCode} onChange={(e) => updateIndividualField("countryCode", e.target.value.replace("+", ""))} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                          </Field>
                          <Field label="Phone" required>
                            <input required value={individualForm.phone} onChange={(e) => updateIndividualField("phone", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                          </Field>
                        </>
                      ) : (
                        <>
                          <Field label="Full Name" required>
                            <input required value={individualForm.fullName} onChange={(e) => updateIndividualField("fullName", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                          </Field>
                          <Field label="Date of Birth" required>
                            <input required type="date" value={individualForm.dob} onChange={(e) => updateIndividualField("dob", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                          </Field>
                          <Field label="Income Range" optional>
                            <select value={individualForm.incomeRange} onChange={(e) => updateIndividualField("incomeRange", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]">
                              <option value="">Not provided</option>
                              {INCOME_RANGES.map((range) => <option key={range} value={range}>{range}</option>)}
                            </select>
                          </Field>
                          <Field label="Profession" optional>
                            <input value={individualForm.profession} onChange={(e) => updateIndividualField("profession", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                          </Field>
                          <Field label="PIN" required>
                            <input required inputMode="numeric" pattern="[0-9]*" value={individualForm.postCode} onChange={(e) => updateIndividualField("postCode", e.target.value.replace(/\D/g, ""))} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                          </Field>
                          <Field label="State" required>
                            <input required value={individualForm.state} onChange={(e) => updateIndividualField("state", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                          </Field>
                          <Field label="City" required>
                            <input required value={individualForm.city} onChange={(e) => updateIndividualField("city", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                          </Field>
                          <Field label="Locality" required>
                            <input required value={individualForm.locality} onChange={(e) => updateIndividualField("locality", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                          </Field>
                          <Field label="District" optional>
                            <input value={individualForm.district} onChange={(e) => updateIndividualField("district", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                          </Field>
                          <Field label="Landmark" optional>
                            <input value={individualForm.landmark} onChange={(e) => updateIndividualField("landmark", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                          </Field>
                        </>
                      )}
                    </div>

                    {individualKycType === "regular" ? (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FileField label="Selfie" required onChange={(file) => setRegularKycFiles((current) => ({ ...current, selfie: file }))} />
                        <FileField label="Aadhaar Front" required onChange={(file) => setRegularKycFiles((current) => ({ ...current, aadharFront: file }))} />
                        <FileField label="Aadhaar Back" required onChange={(file) => setRegularKycFiles((current) => ({ ...current, aadharBack: file }))} />
                        <FileField label="PAN Front" required onChange={(file) => setRegularKycFiles((current) => ({ ...current, panFront: file }))} />
                        <FileField label="PAN Back" required onChange={(file) => setRegularKycFiles((current) => ({ ...current, panBack: file }))} />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="md:col-span-2 text-xs font-medium text-[#64748b]">
                          Upload one photo ID or enter one document number: Driving License, Work Visa, or Emirates ID.
                        </div>
                        <Field label="Driving License Number">
                          <input value={individualForm.drivingLicenseNumber} onChange={(e) => updateIndividualField("drivingLicenseNumber", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                        </Field>
                        <Field label="Work Visa Number">
                          <input value={individualForm.workVisaNumber} onChange={(e) => updateIndividualField("workVisaNumber", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                        </Field>
                        <Field label="Emirates ID Number">
                          <input value={individualForm.emiratesIdNumber} onChange={(e) => updateIndividualField("emiratesIdNumber", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                        </Field>
                        <FileField label="Driving License" onChange={(file) => setNriKycFiles((current) => ({ ...current, drivingLicense: file }))} />
                        <FileField label="Work Visa" onChange={(file) => setNriKycFiles((current) => ({ ...current, workVisa: file }))} />
                        <FileField label="Emirates ID" onChange={(file) => setNriKycFiles((current) => ({ ...current, emiratesId: file }))} />
                        <FileField label="Selfie" onChange={(file) => setNriKycFiles((current) => ({ ...current, selfie: file }))} />
                      </div>
                    )}

                    {submitError ? (
                      <div className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c] break-words">
                        {submitError}
                      </div>
                    ) : null}
                    {submitSuccess ? (
                      <div className="rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#166534] break-words">
                        {submitSuccess}
                      </div>
                    ) : null}

                    <div className="sticky bottom-0 -mx-5 mt-2 flex flex-wrap items-center justify-end gap-3 border-t border-[var(--color-stroke)] bg-white/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:px-6">
                      <button type="button" onClick={closeCreateModal} className="rounded-full border border-[var(--color-stroke)] px-4 py-2 text-sm font-medium text-[#0f172a]">
                        Cancel
                      </button>
                      <button type="submit" disabled={submitting || !individualForm.apiKey.trim()} className="inline-flex items-center gap-2 rounded-full bg-[#0f172a] px-5 py-2 text-sm font-medium text-white disabled:opacity-60">
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                        Submit KYC
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {bankLinkCustomer ? (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden px-3 py-3 transition-[background-color] duration-200 sm:px-6 sm:py-6 ${bankLinkVisible ? "bg-[#0f172a]/35" : "bg-[#0f172a]/0"
            }`}
        >
          <div className="mx-auto flex h-full w-full max-w-3xl items-center justify-center">
            <div
              className={`flex max-h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-[var(--color-stroke)] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] transition-all duration-200 ease-out sm:rounded-[24px] ${bankLinkVisible
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-4 scale-[0.985]"
                }`}
            >
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--color-stroke)] px-5 py-4 sm:px-6">
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold text-[#0f172a]">Link Individual Bank</h2>
                  <p className="mt-1 text-sm text-[#64748b]">{bankLinkCustomer.email}</p>
                </div>
                <button
                  onClick={closeBankLinkModal}
                  className="rounded-xl p-2 hover:bg-[#f8fafc]"
                  aria-label="Close bank link dialog"
                >
                  <X size={18} className="text-[#64748b]" />
                </button>
              </div>

              <form onSubmit={handleLinkIndividualBank} className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {!availableApiKey ? (
                    <Field label="API Key">
                      <input
                        required
                        value={bankLinkForm.apiKey}
                        onChange={(e) => updateBankLinkField("apiKey", e.target.value)}
                        placeholder="Paste tenant API key"
                        className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]"
                      />
                    </Field>
                  ) : null}
                  <Field label="Customer Email">
                    <input
                      required
                      type="email"
                      value={bankLinkForm.email}
                      onChange={(e) => updateBankLinkField("email", e.target.value)}
                      className="h-11 w-full rounded-xl border border-[var(--color-stroke)] bg-[#f8fafc] px-3 text-sm outline-none"
                      readOnly
                    />
                  </Field>
                  <Field label="Full Name">
                    <input required value={bankLinkForm.name} onChange={(e) => updateBankLinkField("name", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                  </Field>
                  <Field label="Account Holder Name">
                    <input required value={bankLinkForm.accountName} onChange={(e) => updateBankLinkField("accountName", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                  </Field>
                  <Field label="Account Number">
                    <input required value={bankLinkForm.accountNumber} onChange={(e) => updateBankLinkField("accountNumber", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                  </Field>
                  <Field label="Bank Name">
                    <div className="relative">
                      <button type="button" onClick={() => setBankPopoverOpen((current) => !current)} className="flex h-11 w-full items-center justify-between rounded-xl border border-[var(--color-stroke)] px-3 text-sm text-[#0f172a] outline-none">
                        <span className={bankLinkForm.bankName ? "truncate" : "text-[#64748b]"}>
                          {bankLinkForm.bankName || (banksLoading ? "Loading banks..." : "Search & select bank")}
                        </span>
                        <ChevronsUpDown size={16} className="text-[#64748b] shrink-0" />
                      </button>
                      {bankPopoverOpen ? (
                        <BankPicker banks={filteredBankMasters} loading={banksLoading} selectedBankName={bankLinkForm.bankName} search={bankSearch} onSearch={setBankSearch} onSelect={selectBank} />
                      ) : null}
                    </div>
                  </Field>
                  <Field label="IFSC">
                    <input required value={bankLinkForm.ifsc} onChange={(e) => updateBankLinkField("ifsc", e.target.value.toUpperCase())} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm uppercase outline-none focus:border-[#0f172a]" />
                  </Field>
                  <Field label="Branch Address" required>
                    <input required value={bankLinkForm.branchAddress} onChange={(e) => updateBankLinkField("branchAddress", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                  </Field>
                  {!bankLinkCustomer?.details?.is_nri ? (
                    <>
                      <Field label="Address" required>
                        <input required value={bankLinkForm.address} onChange={(e) => updateBankLinkField("address", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                      </Field>
                      <Field label="City" required>
                        <input required value={bankLinkForm.city} onChange={(e) => updateBankLinkField("city", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                      </Field>
                      <Field label="Postal Code" required>
                        <input required inputMode="numeric" pattern="[0-9]*" value={bankLinkForm.postCode} onChange={(e) => updateBankLinkField("postCode", e.target.value.replace(/\D/g, ""))} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                      </Field>
                    </>
                  ) : null}
                  <Field label="Account Type">
                    <select value={bankLinkForm.accountType} onChange={(e) => updateBankLinkField("accountType", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]">
                      <option value="Checking">Checking</option>
                      <option value="Savings">Savings</option>
                    </select>
                  </Field>
                  <Field label="Reference">
                    <input value={bankLinkForm.reference} onChange={(e) => updateBankLinkField("reference", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                  </Field>
                </div>

                {submitError ? (
                  <div className="mt-4 rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c] break-words">
                    {submitError}
                  </div>
                ) : null}

                <div className="sticky bottom-0 -mx-5 mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-[var(--color-stroke)] bg-white/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:px-6">
                  <button type="button" onClick={closeBankLinkModal} className="rounded-full border border-[var(--color-stroke)] px-4 py-2 text-sm font-medium text-[#0f172a]">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting || !bankLinkForm.apiKey.trim()} className="inline-flex items-center gap-2 rounded-full bg-[#0f172a] px-5 py-2 text-sm font-medium text-white disabled:opacity-60">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                    Link Bank
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {orderCustomer ? (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden px-3 py-3 transition-[background-color] duration-200 sm:px-6 sm:py-6 ${orderVisible ? "bg-[#0f172a]/35" : "bg-[#0f172a]/0"
            }`}
        >
          <div className="mx-auto flex h-full w-full max-w-2xl items-center justify-center">
            <div
              className={`flex max-h-full min-h-0 w-full flex-col overflow-hidden rounded-[28px] border border-[var(--color-stroke)] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] transition-all duration-200 ease-out ${orderVisible
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-4 scale-[0.985]"
                }`}
            >
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--color-stroke)] px-6 py-5">
                <div>
                  <h2 className="text-xl font-semibold text-[#0f172a]">Create Order</h2>
                  <p className="mt-1 text-sm text-[#64748b]">{orderCustomer.email}</p>
                </div>
                <button
                  onClick={closeOrderModal}
                  className="rounded-xl p-2 hover:bg-[#f8fafc]"
                  aria-label="Close order dialog"
                >
                  <X size={18} className="text-[#64748b]" />
                </button>
              </div>

              <form onSubmit={handlePreviewLocalOrder} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {!availableApiKey ? (
                      <Field label="API Key">
                        <input required value={orderForm.apiKey} onChange={(e) => updateOrderField("apiKey", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                      </Field>
                    ) : null}
                    <Field label="Customer Email">
                      <input required readOnly value={orderForm.email} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] bg-[#f8fafc] px-3 text-sm outline-none" />
                    </Field>
                    <Field label="Token">
                      <select value={orderForm.sellTokenSymbol} onChange={(e) => updateOrderField("sellTokenSymbol", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]">
                        <option value="USDC">USDC</option>
                        <option value="USDT" disabled={orderForm.chainId === "8453"}>USDT</option>
                      </select>
                    </Field>
                    <Field label="Chain">
                      <select
                        value={orderForm.chainId}
                        onChange={(e) => {
                          updateOrderField("chainId", e.target.value);
                          if (e.target.value === "8453") updateOrderField("sellTokenSymbol", "USDC");
                        }}
                        className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]"
                      >
                        <option value="137">Polygon</option>
                        <option value="8453">Base</option>
                      </select>
                    </Field>
                    <Field label="Sell Amount" required>
                      <input required type="number" min="0" step="0.000001" value={orderForm.sellTokenAmount} onChange={(e) => updateOrderField("sellTokenAmount", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                    </Field>
                    <Field label="Fiat Currency">
                      <input required value={orderForm.fiatCurrency} onChange={(e) => updateOrderField("fiatCurrency", e.target.value.toUpperCase())} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm uppercase outline-none focus:border-[#0f172a]" />
                    </Field>
                    <Field label="Bank Account">
                      <input required value={orderForm.accountNumber} onChange={(e) => updateOrderField("accountNumber", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                    </Field>
                    <Field label="IFSC">
                      <input required value={orderForm.ifsc} onChange={(e) => updateOrderField("ifsc", e.target.value.toUpperCase())} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm uppercase outline-none focus:border-[#0f172a]" />
                    </Field>
                    <Field label="Refund Wallet">
                      <input required value={orderForm.refundWalletAddress} onChange={(e) => updateOrderField("refundWalletAddress", e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[#0f172a]" />
                    </Field>
                    <label className="flex h-11 items-center gap-2 self-end rounded-xl border border-[var(--color-stroke)] bg-[#f8fafc] px-3 text-sm text-[#0f172a]">
                      <input type="checkbox" checked={orderForm.isNRI} readOnly />
                      NRI customer
                    </label>
                  </div>

                  {orderDepositPreview && !createdOrder ? (
                    <div className="mt-5 rounded-2xl border border-[#bae6fd] bg-[#f0f9ff] p-4 text-sm text-[#075985]">
                      <div className="font-semibold">Deposit address</div>
                      <div className="mt-2 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[#0f172a]">
                        <span className="min-w-0 flex-1 break-all font-mono text-xs">
                          {orderDepositPreview.depositAddress}
                        </span>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard?.writeText(orderDepositPreview.depositAddress)}
                          className="rounded-lg p-2 hover:bg-[#f8fafc]"
                          aria-label="Copy deposit address"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <InfoCard compact label="Deposit Amount" value={`${orderForm.sellTokenAmount || "-"} ${orderForm.sellTokenSymbol}`} />
                        <InfoCard compact label="Network" value={orderDepositPreview.chainCode || String(orderDepositPreview.chainId)} />
                        <InfoCard compact label="Token" value={orderDepositPreview.sellTokenSymbol} />
                        <InfoCard compact label="KYC Type" value={orderForm.isNRI ? "NRI" : "Regular"} />
                      </div>
                      <div className="mt-3 rounded-xl border border-[#dbeafe] bg-white p-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a94a6]">Wallet Balance</div>
                            <div className="mt-1 text-sm font-medium text-[#0f172a]">
                              {orderBalancePreview ? `${orderBalancePreview.walletBalance} ${orderForm.sellTokenSymbol}` : "-"}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => fetchOrderBalance()}
                            disabled={orderBalanceLoading || orderBalanceRefreshLocked}
                            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-stroke)] px-3 py-2 text-xs font-medium text-[#0f172a] disabled:opacity-50"
                          >
                            {orderBalanceLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                            Refresh
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-[#64748b]">Required: {orderForm.sellTokenAmount || "-"} {orderForm.sellTokenSymbol}</span>
                          {orderBalancePreview ? (
                            <span className={`rounded-full px-2 py-1 font-medium ${orderBalancePreview.balanceSufficient ? "bg-[#dcfce7] text-[#166534]" : "bg-[#fee2e2] text-[#b91c1c]"}`}>
                              {orderBalancePreview.balanceSufficient ? "Enough balance" : "Insufficient balance"}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {createdOrder ? (
                    <div className="mt-5 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] p-4 text-sm text-[#166534]">
                      <div className="font-semibold">Order created</div>
                      <div className="mt-2 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[#0f172a]">
                        <span className="min-w-0 flex-1 break-all font-mono text-xs">
                          {orderDepositPreview?.depositAddress || "-"}
                        </span>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard?.writeText(orderDepositPreview?.depositAddress || "")}
                          className="rounded-lg p-2 hover:bg-[#f8fafc]"
                          aria-label="Copy deposit address"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <InfoCard compact label="Order ID" value={createdOrder.order_id || createdOrder.orderId || "-"} />
                        <InfoCard compact label="Deposit Amount" value={`${createdOrder.sell_token_amount || createdOrder.sellTokenAmount || orderForm.sellTokenAmount} ${orderForm.sellTokenSymbol}`} />
                        <InfoCard compact label="Expected Payout" value={`${createdOrder.fiat_amount || createdOrder.fiatAmount || "-"} ${createdOrder.fiat_currency || createdOrder.fiatCurrency || orderForm.fiatCurrency}`} />
                        <InfoCard compact label="KYC Type" value={orderForm.isNRI ? "NRI" : "Regular"} />
                      </div>
                    </div>
                  ) : null}

                  {submitError ? (
                    <div className="mt-4 rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c] break-words">
                      {submitError}
                    </div>
                  ) : null}

                </div>

                <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-[var(--color-stroke)] bg-white px-5 py-4 sm:px-6">
                  <button type="button" onClick={closeOrderModal} className="rounded-full border border-[var(--color-stroke)] px-4 py-2 text-sm font-medium text-[#0f172a]">
                    Cancel
                  </button>
                  <button
                    type={orderDepositPreview ? "button" : "submit"}
                    onClick={orderDepositPreview ? handleCreateLocalOrder : undefined}
                    disabled={
                      submitting ||
                      !orderForm.apiKey.trim() ||
                      (Boolean(orderDepositPreview) && (!orderBalancePreview?.balanceSufficient || Boolean(createdOrder)))
                    }
                    className="inline-flex items-center gap-2 rounded-full bg-[#0f172a] px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {orderDepositPreview
                      ? createdOrder
                        ? "Order Created"
                        : orderBalancePreview?.balanceSufficient
                          ? "Create Order"
                          : "Waiting for Balance"
                      : "Show Deposit Address"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {selectedCustomer ? (
        <div
          className={`fixed inset-0 z-50 px-4 py-6 overflow-y-auto transition-[background-color] duration-200 ${customerDetailsVisible ? "bg-[#0f172a]/35" : "bg-[#0f172a]/0"
            }`}
        >
          <div className="mx-auto flex min-h-full w-full max-w-2xl items-center justify-center">
            <div
              className={`w-full max-h-[calc(100vh-3rem)] overflow-hidden rounded-[28px] border border-[var(--color-stroke)] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] transition-all duration-200 ease-out ${customerDetailsVisible
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-4 scale-[0.985]"
                }`}
            >
              <div className="flex items-start justify-between gap-4 border-b border-[var(--color-stroke)] px-6 py-5">
                <div>
                  <h2 className="text-xl font-semibold text-[#0f172a]">{selectedCustomer.details?.business_name || selectedCustomer.name}</h2>
                  <p className="mt-1 text-sm text-[#64748b]">{selectedCustomer.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cust = selectedCustomer;
                      setSelectedCustomer(null);
                      openKycModalForCustomer(cust);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-[var(--color-brand)] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[var(--color-brand-hover)] transition-all shadow-xs shrink-0"
                  >
                    Resume form filling
                  </button>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="rounded-xl p-2 hover:bg-[#f8fafc]"
                    aria-label="Close customer details dialog"
                  >
                    <X size={18} className="text-[#64748b]" />
                  </button>
                </div>
              </div>

              <div className="max-h-[calc(100vh-10rem)] overflow-y-auto px-6 py-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoCard label="Customer Type" value={selectedCustomerType || "Unknown"} />
                  {selectedCustomerType === "business" ? (
                    <div className="rounded-2xl border border-[var(--color-stroke)] bg-[#f8fafc] p-4 flex flex-col justify-between">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a94a6]">KYB Status</div>
                      <div className="mt-1 text-base font-semibold text-[#0f172a]">{selectedCustomer.details?.kyb_status || "NOT_SUBMITTED"}</div>
                      <button
                        type="button"
                        onClick={() => {
                          const cust = selectedCustomer;
                          setSelectedCustomer(null);
                          openKycModalForCustomer(cust);
                        }}
                        className="mt-2 text-xs font-semibold text-[var(--color-brand)] hover:underline text-left"
                      >
                        Resume KYB form filling →
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-[var(--color-stroke)] bg-[#f8fafc] p-4 flex flex-col justify-between">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a94a6]">KYC Status</div>
                      <div className="mt-1 text-base font-semibold text-[#0f172a]">{selectedCustomer.details?.kyc_status || "NOT_STARTED"}</div>
                      <button
                        type="button"
                        onClick={() => {
                          const cust = selectedCustomer;
                          setSelectedCustomer(null);
                          openKycModalForCustomer(cust);
                        }}
                        className="mt-2 text-xs font-semibold text-[var(--color-brand)] hover:underline text-left"
                      >
                        Resume KYC form filling →
                      </button>
                    </div>
                  )}
                  <InfoCard label="Last Login" value={selectedCustomer.last_logged_in ? new Date(selectedCustomer.last_logged_in).toLocaleString() : "Never"} />
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-[#8a94a6]">Bank Details</h3>
                  <div className="mt-3 flex flex-col gap-3">
                    {(selectedCustomer.details?.bank_accounts || []).length === 0 ? (
                      <div className="rounded-2xl border border-[var(--color-stroke)] bg-[#f8fafc] px-4 py-3 text-sm text-[#64748b]">
                        No linked bank details found.
                      </div>
                    ) : (
                      selectedCustomer.details?.bank_accounts.map((account, index) => (
                        <div key={`${account.provider}-${index}`} className="rounded-2xl border border-[var(--color-stroke)] bg-[#f8fafc] p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-[#0f172a]">{getBankAccountChannel(account.provider)}</div>
                            <div className="text-xs text-[#64748b]">
                              {account.link_status || account.recipient_status || (account.is_active ? "Active" : "Inactive")}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <InfoCard compact label="Account Name" value={account.account_name || "-"} />
                            <InfoCard compact label="Account Number" value={account.account_number_masked || "-"} />
                            <InfoCard compact label="Bank Name" value={account.bank_name || "-"} />
                            <InfoCard compact label="IFSC" value={account.ifsc || "-"} />
                            <InfoCard compact label="Country" value={account.country || "-"} />
                            <InfoCard compact label="Currency" value={account.currency || "-"} />
                            <InfoCard compact label="Payment Code" value={account.payment_code || "-"} />
                            <InfoCard compact label="IBAN" value={account.iban_number_masked || "-"} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-[#8a94a6]">KYB Documents On Record</h3>
                  <div className="mt-3 rounded-2xl border border-[var(--color-stroke)] bg-[#f8fafc] p-4">
                    {(selectedCustomer.details?.kyb_documents || []).length === 0 ? (
                      <p className="text-sm text-[#64748b]">No KYB docs recorded yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedCustomer.details?.kyb_documents.map((documentKey) => (
                          <span key={documentKey} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#0f172a] border border-[var(--color-stroke)]">
                            {humanizeKybDocument(documentKey)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-[#8a94a6]">Offramp V2 Verification</h3>
                    <Link
                      href={`/customers/${selectedCustomer.id}/virtual-accounts?email=${encodeURIComponent(selectedCustomer.email)}`}
                      className="text-sm font-medium text-[#0f172a] underline"
                    >
                      Virtual accounts
                    </Link>
                  </div>
                  <div className="mt-3 flex flex-col gap-3">
                    {selectedOfframpCustomers.length === 0 ? (
                      <div className="rounded-2xl border border-[var(--color-stroke)] bg-[#f8fafc] px-4 py-3 text-sm text-[#64748b]">
                        No Offramp V2 profile has been created for this customer.
                      </div>
                    ) : (
                      selectedOfframpCustomers.map((customer) => (
                        <div key={customer.id} className="rounded-2xl border border-[var(--color-stroke)] bg-[#f8fafc] p-4">
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="font-semibold capitalize text-[#0f172a]">{customer.profileType}</span>
                            <span className="text-[#64748b]">{offrampVerificationLabel(selectedCustomer, [customer])}</span>
                          </div>
                          {customer.verification.profile?.missing_fields?.length ? (
                            <p className="mt-2 text-xs text-[#64748b]">
                              Missing: {customer.verification.profile.missing_fields.join(", ")}
                            </p>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {kycModalCustomer ? (() => {
        const offrampCusts = offrampCustomersByEmail[kycModalCustomer.email] || offrampCustomersByEmail[kycModalCustomer.email?.toLowerCase()] || [];
        const profileType = getCustomerProfileType(kycModalCustomer, offrampCusts);
        const isBusiness = profileType === "business";
        const customerId =
          offrampCusts.find((c) => c.profileType === profileType)?.id ||
          offrampCusts[0]?.id ||
          String(kycModalCustomer.id);

        console.log("[Resume Modal Render]", {
          profileType,
          resolvedCustomerId: customerId,
          email: kycModalCustomer.email,
          offrampCusts,
        });

        return (
          <div
            className={`fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[#0f172a]/35 px-4 py-6 transition-all duration-200 ${kycModalVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
          >
            <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl border border-[var(--color-stroke)]">
              <button
                onClick={closeKycModal}
                className="absolute top-5 right-5 z-10 rounded-xl p-2 bg-[#f8fafc] hover:bg-[#e2e8f0] text-[#64748b] transition-colors"
                aria-label={`Close ${isBusiness ? "KYB" : "KYC"} form modal`}
              >
                <X size={20} />
              </button>
              {isBusiness ? (
                <KybForm
                  businessData={{
                    legalName: kycModalCustomer.details?.business_name || kycModalCustomer.name || "",
                    email: kycModalCustomer.email,
                    customerId,
                  }}
                  onBack={closeKycModal}
                  onComplete={() => {
                    closeKycModal();
                    handlePageChange(users.page_number);
                  }}
                  onReturnToCustomers={() => {
                    closeKycModal();
                    handlePageChange(users.page_number);
                  }}
                />
              ) : (
                <KycForm
                  customerData={{
                    customerId,
                    email: kycModalCustomer.email,
                    firstName: kycModalCustomer.details?.first_name || (kycModalCustomer.name ? kycModalCustomer.name.split(" ")[0] : ""),
                    lastName: kycModalCustomer.details?.last_name || (kycModalCustomer.name ? kycModalCustomer.name.split(" ").slice(1).join(" ") : ""),
                  }}
                  onBack={closeKycModal}
                  onComplete={() => {
                    closeKycModal();
                    handlePageChange(users.page_number);
                  }}
                  onReturnToCustomers={() => {
                    closeKycModal();
                    handlePageChange(users.page_number);
                  }}
                />
              )}
            </div>
          </div>
        );
      })() : null}
    </div>
  );
}

function Field({
  label,
  children,
  required = false,
  optional = false,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-[0.06em] text-[#8a94a6]">
        {label}
        {required ? <span className="text-[#dc2626]">*</span> : null}
        {optional ? <span className="text-[#94a3b8]">(Optional)</span> : null}
      </span>
      {children}
    </label>
  );
}

function FileField({
  label,
  required = false,
  onChange,
}: {
  label: string;
  required?: boolean;
  onChange: (file: File | null) => void;
}) {
  return (
    <Field label={label} required={required} optional={!required}>
      <input
        required={required}
        type="file"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        className="block w-full text-sm text-[#0f172a] file:mr-4 file:rounded-full file:border-0 file:bg-[#0f172a] file:px-4 file:py-2 file:text-xs file:font-medium file:text-white"
      />
    </Field>
  );
}

function BankPicker({
  banks,
  loading,
  selectedBankName,
  search,
  onSearch,
  onSelect,
}: {
  banks: BankMaster[];
  loading: boolean;
  selectedBankName: string;
  search: string;
  onSearch: (value: string) => void;
  onSelect: (bank: BankMaster) => void;
}) {
  return (
    <div className="absolute left-0 top-12 z-30 w-full overflow-hidden rounded-2xl border border-[var(--color-stroke)] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
      <div className="border-b border-[var(--color-stroke)] p-2">
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search bank..."
          className="h-10 w-full rounded-xl bg-[#f8fafc] px-3 text-sm outline-none"
        />
      </div>
      <div className="max-h-[260px] overflow-y-auto py-1">
        {banks.length === 0 ? (
          <div className="px-3 py-2 text-sm text-[#64748b]">
            {loading ? "Loading banks..." : "No bank found."}
          </div>
        ) : (
          banks.map((bank) => (
            <button
              type="button"
              key={bank._id || `${bank.paymentCode}-${bank.name}`}
              onClick={() => onSelect(bank)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#f8fafc]"
            >
              <Check
                size={14}
                className={selectedBankName === bank.name ? "opacity-100 text-[#0f172a]" : "opacity-0"}
              />
              <span className="truncate">{bank.name}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function DocumentBlock({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-stroke)] bg-[#f8fafc] p-4">
      <div className="mb-3">
        <div className="text-sm font-semibold text-[#0f172a]">{title}</div>
        <div className="text-xs text-[#64748b]">{description}</div>
      </div>
      {children}
    </div>
  );
}

function CountSection({
  title,
  description,
  count,
  min,
  max,
  onChange,
}: {
  title: string;
  description: string;
  count: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-stroke)] bg-[#f8fafc] p-4">
      <div className="mb-3">
        <div className="text-sm font-semibold text-[#0f172a]">{title}</div>
        <div className="text-xs text-[#64748b]">{description}</div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#64748b]">Count</span>
        <select
          value={count}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-10 rounded-xl border border-[var(--color-stroke)] bg-white px-3 text-sm outline-none"
        >
          {Array.from({ length: max - min + 1 }, (_, index) => min + index).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function RoleUploadSection({
  title,
  roleLabel,
  entries,
  onFileChange,
}: {
  title: string;
  roleLabel: string;
  entries: PersonFileEntry[];
  onFileChange: (index: number, file: File | null) => void;
}) {
  return (
    <DocumentBlock title={title} description={`Upload PAN once per ${roleLabel.toLowerCase()}.`}>
      <div className="flex flex-col gap-4">
        {entries.map((entry, index) => (
          <div key={`${roleLabel}-${index}`} className="rounded-xl border border-[var(--color-stroke)] bg-white p-3">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-[#8a94a6]">
              {roleLabel} {index + 1}
            </div>
            <input
              type="file"
              onChange={(e) => onFileChange(index, e.target.files?.[0] || null)}
              className="block w-full text-sm text-[#0f172a] file:mr-4 file:rounded-full file:border-0 file:bg-[#0f172a] file:px-4 file:py-2 file:text-xs file:font-medium file:text-white"
            />
            <div className="mt-2 text-xs text-[#64748b]">
              {entry.file?.name || "No file chosen"}
            </div>
          </div>
        ))}
      </div>
    </DocumentBlock>
  );
}

function RoleReuseSection({
  title,
  roleLabel,
  entries,
  reuseOptions,
  onEntryChange,
}: {
  title: string;
  roleLabel: string;
  entries: PersonFileEntry[];
  reuseOptions: { value: string; label: string }[];
  onEntryChange: (index: number, patch: Partial<PersonFileEntry>) => void;
}) {
  return (
    <DocumentBlock title={title} description={`Each ${roleLabel.toLowerCase()} can upload fresh or reuse an earlier person.`}>
      <div className="flex flex-col gap-4">
        {entries.map((entry, index) => (
          <div key={`${roleLabel}-${index}`} className="rounded-xl border border-[var(--color-stroke)] bg-white p-3">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-[#8a94a6]">
              {roleLabel} {index + 1}
            </div>
            <Field label="Reuse Existing Upload">
              <select
                value={entry.reuseRole && entry.reuseIndex ? `${entry.reuseRole}:${entry.reuseIndex}` : ""}
                onChange={(e) => {
                  const [reuseRole, reuseIndex] = e.target.value.split(":");
                  onEntryChange(index, {
                    reuseRole: (reuseRole as PersonFileEntry["reuseRole"]) || "",
                    reuseIndex: reuseIndex || "",
                    file: null,
                  });
                }}
                className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none"
              >
                <option value="">Upload separately</option>
                {reuseOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            {!entry.reuseRole ? (
              <>
                <input
                  type="file"
                  onChange={(e) => onEntryChange(index, { file: e.target.files?.[0] || null })}
                  className="mt-3 block w-full text-sm text-[#0f172a] file:mr-4 file:rounded-full file:border-0 file:bg-[#0f172a] file:px-4 file:py-2 file:text-xs file:font-medium file:text-white"
                />
                <div className="mt-2 text-xs text-[#64748b]">{entry.file?.name || "No file chosen"}</div>
              </>
            ) : (
              <div className="mt-3 rounded-xl bg-[#f8fafc] px-3 py-2 text-sm text-[#64748b]">
                Reusing uploaded PAN from {entry.reuseRole} {Number(entry.reuseIndex) + 1}.
              </div>
            )}
          </div>
        ))}
      </div>
    </DocumentBlock>
  );
}

function UboSection({
  entries,
  reuseOptions,
  onEntryChange,
}: {
  entries: UboEntry[];
  reuseOptions: { value: string; label: string }[];
  onEntryChange: (index: number, patch: Partial<UboEntry>) => void;
}) {
  return (
    <DocumentBlock title="UBO PAN Front and Back" description="Each UBO has phone number plus either fresh front/back uploads or reuse from an existing person.">
      <div className="flex flex-col gap-4">
        {entries.map((entry, index) => (
          <div key={`ubo-${index}`} className="rounded-xl border border-[var(--color-stroke)] bg-white p-3">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-[#8a94a6]">
              UBO {index + 1}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Phone Number">
                <input
                  value={entry.phone}
                  onChange={(e) => onEntryChange(index, { phone: e.target.value })}
                  placeholder="+91..."
                  className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none"
                />
              </Field>
              <Field label="Reuse Existing Upload">
                <select
                  value={entry.reuseRole && entry.reuseIndex ? `${entry.reuseRole}:${entry.reuseIndex}` : ""}
                  onChange={(e) => {
                    const [reuseRole, reuseIndex] = e.target.value.split(":");
                    onEntryChange(index, {
                      reuseRole: (reuseRole as UboEntry["reuseRole"]) || "",
                      reuseIndex: reuseIndex || "",
                      frontFile: null,
                      backFile: null,
                    });
                  }}
                  className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none"
                >
                  <option value="">Upload separately</option>
                  {reuseOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            {!entry.reuseRole ? (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="UBO PAN Front">
                  <input
                    type="file"
                    onChange={(e) => onEntryChange(index, { frontFile: e.target.files?.[0] || null })}
                    className="block w-full text-sm text-[#0f172a] file:mr-4 file:rounded-full file:border-0 file:bg-[#0f172a] file:px-4 file:py-2 file:text-xs file:font-medium file:text-white"
                  />
                </Field>
                <Field label="UBO PAN Back">
                  <input
                    type="file"
                    onChange={(e) => onEntryChange(index, { backFile: e.target.files?.[0] || null })}
                    className="block w-full text-sm text-[#0f172a] file:mr-4 file:rounded-full file:border-0 file:bg-[#0f172a] file:px-4 file:py-2 file:text-xs file:font-medium file:text-white"
                  />
                </Field>
              </div>
            ) : (
              <div className="mt-3 rounded-xl bg-[#f8fafc] px-3 py-2 text-sm text-[#64748b]">
                Reusing upload from {entry.reuseRole} {Number(entry.reuseIndex) + 1}. For UBO, same file will be sent to front/back fields.
              </div>
            )}
          </div>
        ))}
      </div>
    </DocumentBlock>
  );
}

function InfoCard({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-2xl border border-[var(--color-stroke)] bg-[#f8fafc] ${compact ? "p-3" : "p-4"}`}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a94a6]">{label}</div>
      <div className={`${compact ? "mt-1 text-sm" : "mt-2 text-base"} font-medium text-[#0f172a] break-words`}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ customer }: { customer: SubUser }) {
  const providerStatus = (customer.provider_status || "").toUpperCase();

  let label = customer.is_active ? "Active" : "Inactive";
  let classes = customer.is_active
    ? "bg-[#e7f9ed] border border-[#5ee77a] text-[#05bb5c]"
    : "bg-[#fee2e2] border border-[#fca5a5] text-[#dc2626]";

  if (["UNDER_REVIEW"].includes(providerStatus)) {
    label = "Under Review";
    classes = "bg-[#fef9c3] border border-[#facc15] text-[#a16207]";
  } else if (["REJECTED", "FAILED"].includes(providerStatus)) {
    label = "Rejected";
    classes = "bg-[#fee2e2] border border-[#fca5a5] text-[#dc2626]";
  } else if (["APPROVED", "SUBMITTED", "COMPLETED", "ACTIVE"].includes(providerStatus)) {
    label = "Active";
    classes = "bg-[#e7f9ed] border border-[#5ee77a] text-[#05bb5c]";
  } else if (["NEEDS_DATA"].includes(providerStatus)) {
    label = "Needs Data";
    classes = "bg-[#fef9c3] border border-[#facc15] text-[#a16207]";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-[25px] capitalize ${classes}`}
    >
      {label === "Active" ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ) : null}
      {label}
    </span>
  );
}
