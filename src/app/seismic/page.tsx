"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Check, Loader2, User } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import KycForm from "@/components/seismic/kyc";
import KybForm from "@/components/seismic/kyb";
import { createCustomer } from "@/actions/seismic/individual";


type CustomerMode = "individual" | "business";
type ViewMode = "type-select" | "details" | "wizard";

export default function SeismicPage() {
  const router = useRouter();
  const [customerMode, setCustomerMode] = useState<CustomerMode>("individual");
  const [viewMode, setViewMode] = useState<ViewMode>("type-select");

  // Initial creation details form state matching Image 1
  const [detailsForm, setDetailsForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    legalName: "",
    tradeName: "",
  });




  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createdCustomerId, setCreatedCustomerId] = useState<string | undefined>(undefined);

  function handleSelectType(type: CustomerMode) {
    setCustomerMode(type);
    setViewMode("details");
  }

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);
    setCreateError("");
    try {
      const result = await createCustomer({
        email: detailsForm.email,
        profileType: customerMode,
        country: "IN",
        corridor: "global",
      });
      // Capture the created customer ID from the response
      const customerId = result?.data?.id || result?.id || result?.data?.customer_id || result?.customer_id;
      setCreatedCustomerId(customerId);
      console.log("[SeismicPage] Created customer ID:", customerId, "Full response:", result);
      // Customer created — go straight into the KYC/KYB wizard
      setViewMode("wizard");
    } catch (error: any) {
      console.error("Error creating customer:", error);
      setCreateError(error?.response?.data?.message || error?.message || "Failed to create customer. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }


  return (
    <DashboardShell active="KYC/KYB">
      <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
        {/* Step 1: Customer Type Selection */}
        {viewMode === "type-select" && (
          <div className="flex flex-col gap-6">
            {/* Top Navigation */}
            <div className="flex flex-col gap-2">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Create Customer</h1>
                <p className="text-sm text-[#64748b] mt-0.5">
                  Register an end customer you can transact on behalf of.
                </p>
              </div>
            </div>

            {/* Pill Step Bar */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-brand)] text-white text-xs font-semibold">
                <span>01</span>
                <span>Customer Type</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f1f5f9] text-[#94a3b8] text-xs font-semibold">
                <span>02</span>
                <span>Details</span>
              </div>
            </div>

            {/* Main Selection Header */}
            <div className="pt-2">
              <h2 className="text-lg font-bold text-[#0f172a]">What kind of customer is this?</h2>
              <p className="text-sm text-[#64748b] mt-1">
                Pick the entity type: it determines whether they're verified through KYC or KYB.
              </p>
            </div>

            {/* Entity Options Cards matching design */}
            <div className="flex flex-col gap-4 max-w-3xl">
              {/* Individual Option */}
              <div
                onClick={() => handleSelectType("individual")}
                className={`group flex flex-col p-5 rounded-2xl border bg-white shadow-xs hover:shadow-md hover:border-[var(--color-brand)] cursor-pointer transition-all duration-200 ${customerMode === "individual" ? "border-[var(--color-brand)] ring-1 ring-[var(--color-brand)]" : "border-[var(--color-stroke)]"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f5f9] group-hover:bg-[var(--color-brand)] group-hover:text-white text-[#0f172a] transition-colors">
                      <User size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#0f172a]">Individual</h3>
                      <p className="text-sm text-[#64748b] mt-0.5">A person, verified through KYC.</p>
                    </div>
                  </div>
                  <div className={`h-6 w-6 rounded-full border flex items-center justify-center transition-all ${customerMode === "individual" ? "border-[var(--color-brand)] bg-[var(--color-brand)]" : "border-[var(--color-stroke)] group-hover:border-[var(--color-brand)] group-hover:bg-[var(--color-brand)]"
                    }`}>
                    <Check size={14} className={`text-white transition-opacity ${customerMode === "individual" ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                  </div>
                </div>
              </div>

              {/* Business Option */}
              <div
                onClick={() => handleSelectType("business")}
                className={`group flex flex-col p-5 rounded-2xl border bg-white shadow-xs hover:shadow-md hover:border-[var(--color-brand)] cursor-pointer transition-all duration-200 ${customerMode === "business" ? "border-[var(--color-brand)] ring-1 ring-[var(--color-brand)]" : "border-[var(--color-stroke)]"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f5f9] group-hover:bg-[var(--color-brand)] group-hover:text-white text-[#0f172a] transition-colors">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#0f172a]">Business</h3>
                      <p className="text-sm text-[#64748b] mt-0.5">A company or other legal entity, verified through KYB.</p>
                    </div>
                  </div>
                  <div className={`h-6 w-6 rounded-full border flex items-center justify-center transition-all ${customerMode === "business" ? "border-[var(--color-brand)] bg-[var(--color-brand)]" : "border-[var(--color-stroke)] group-hover:border-[var(--color-brand)] group-hover:bg-[var(--color-brand)]"
                    }`}>
                    <Check size={14} className={`text-white transition-opacity ${customerMode === "business" ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Initial Details Form matching Image 1 */}
        {viewMode === "details" && (
          <div className="flex flex-col gap-6">
            {/* Top Navigation */}
            <div className="flex flex-col gap-2">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">Create Customer</h1>
                <p className="text-sm text-[#64748b] mt-0.5">
                  Register an end customer you can transact on behalf of.
                </p>
              </div>
            </div>

            {/* Pill Step Bar matching Image 1 */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode("type-select")}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f1f5f9] text-[#94a3b8] text-xs font-semibold hover:bg-[#e2e8f0] transition-colors"
              >
                <span>01</span>
                <span>Customer Type ({customerMode})</span>
              </button>
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-brand)] text-white text-xs font-semibold shadow-xs">
                <span>02</span>
                <span>Details</span>
              </div>
            </div>

            {/* Initial Details Form Area matching Image 1 */}
            <form onSubmit={handleCreateCustomer} className="flex flex-col gap-6 pt-2 max-w-4xl">
              <div>
                <h2 className="text-lg font-bold text-[#0f172a]">
                  {customerMode === "individual" ? "Individual details" : "Business details"}
                </h2>
                <p className="text-sm text-[#64748b] mt-1">
                  {customerMode === "individual"
                    ? "We'll use this to start the KYC wizard once the customer is created."
                    : "We'll use this to start the KYB wizard once the customer is created."}
                </p>
              </div>

              {/* Form Input Fields matching Image 1 */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#0f172a]">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    value={detailsForm.email}
                    onChange={(e) => setDetailsForm({ ...detailsForm, email: e.target.value })}
                    className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3.5 text-sm outline-none focus:border-[var(--color-brand)]"
                  />
                </div>

                {customerMode === "individual" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[#0f172a]">First Name</label>
                      <input
                        type="text"
                        value={detailsForm.firstName}
                        onChange={(e) => setDetailsForm({ ...detailsForm, firstName: e.target.value })}
                        className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3.5 text-sm outline-none focus:border-[var(--color-brand)]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[#0f172a]">Last Name</label>
                      <input
                        type="text"
                        value={detailsForm.lastName}
                        onChange={(e) => setDetailsForm({ ...detailsForm, lastName: e.target.value })}
                        className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3.5 text-sm outline-none focus:border-[var(--color-brand)]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[#0f172a]">Legal Name *</label>
                      <input
                        required
                        type="text"
                        value={detailsForm.legalName}
                        onChange={(e) => setDetailsForm({ ...detailsForm, legalName: e.target.value })}
                        className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3.5 text-sm outline-none focus:border-[var(--color-brand)]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[#0f172a]">Trade Name (DBA)</label>
                      <input
                        type="text"
                        value={detailsForm.tradeName}
                        onChange={(e) => setDetailsForm({ ...detailsForm, tradeName: e.target.value })}
                        className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3.5 text-sm outline-none focus:border-[var(--color-brand)]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Error message */}
              {createError && (
                <p className="text-xs text-red-500 mt-1">{createError}</p>
              )}

              {/* Bottom Action Bar matching Image 1 */}
              <div className="flex items-center justify-between pt-6 border-t border-[var(--color-stroke)] mt-2">
                <button
                  type="button"
                  onClick={() => setViewMode("type-select")}
                  className="text-sm font-semibold cursor-pointer text-[#0f172a] hover:opacity-80 transition-opacity"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex items-center cursor-pointer gap-2 px-6 py-2.5 rounded-full bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all shadow-xs"
                >
                  {isCreating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Customer"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Full Wizard Forms matching Image 2 & Image 3 */}
        {viewMode === "wizard" && (
          <div className="w-full">
            {customerMode === "individual" ? (
              <KycForm
                customerData={{
                  customerId: createdCustomerId,
                  email: detailsForm.email,
                  firstName: detailsForm.firstName || "Aryan",
                  lastName: detailsForm.lastName || "Shrivastava",
                }}
                onBack={() => setViewMode("details")}
                onReturnToCustomers={() => setViewMode("type-select")}
              />
            ) : (
              <KybForm
                businessData={{
                  email: detailsForm.email,
                  legalName: detailsForm.legalName || "DashX",
                }}
                onBack={() => setViewMode("details")}
                onReturnToCustomers={() => setViewMode("type-select")}
              />
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}