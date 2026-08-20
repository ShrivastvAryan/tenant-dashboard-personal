/**
 * KYB Profile Enum Mappings
 * Maps human-readable display labels to backend enum values according to Offramp v2 spec.
 * Reference: docs/offramp-v2-tenant-enums.md
 */

export interface KybEnumOption {
    label: string;
    value: string;
}

/**
 * business.entityType Enums
 * Offramp v2 Tenant Spec (docs/offramp-v2-tenant-enums.md:L94-L108)
 */
export const ENTITY_TYPE_OPTIONS: KybEnumOption[] = [
    { label: "Sole Proprietorship", value: "sole_proprietorship" },
    { label: "Limited Liability Company (LLC)", value: "llc" },
    { label: "S-Corporation", value: "s_corporation" },
    { label: "C-Corporation", value: "c_corporation" },
    { label: "B-Corporation", value: "b_corporation" },
    { label: "Non-Profit Organization", value: "non_profit" },
    { label: "Partnership", value: "partnership" },
    { label: "Limited Partnership", value: "limited_partnership" },
    { label: "Limited Liability Partnership", value: "limited_liability_partnership" },
    { label: "Trust", value: "trust" },
    { label: "DAO (Decentralized Autonomous Organization)", value: "dao" },
    { label: "Cooperative", value: "cooperative" },
    { label: "Other", value: "other" },
];

/**
 * business.regulatedStatus / operations.regulatedStatus Enums
 * Offramp v2 Tenant Spec (docs/offramp-v2-tenant-enums.md:L112-L118)
 */
export const REGULATED_STATUS_OPTIONS: KybEnumOption[] = [
    { label: "Regulated", value: "regulated" },
    { label: "Registered", value: "registered" },
    { label: "Licensed", value: "licensed" },
    { label: "Unregulated", value: "unregulated" },
    { label: "Not Required", value: "not_required" },
];

/**
 * associatedPersons[].roles Enums
 * Offramp v2 Tenant Spec (docs/offramp-v2-tenant-enums.md:L125-L131)
 */
export const ASSOCIATED_PERSON_ROLE_OPTIONS: KybEnumOption[] = [
    { label: "Beneficial Owner", value: "beneficial_owner" },
    { label: "Control Person", value: "control_person" },
    { label: "Officer", value: "officer" },
    { label: "Director", value: "director" },
    { label: "Authorized Signer", value: "authorized_signer" },
];

/**
 * Business Document Kind Enums
 * Offramp v2 Tenant Spec (docs/offramp-v2-tenant-enums.md:L183-L199)
 */
export const BUSINESS_DOCUMENT_KIND_OPTIONS: KybEnumOption[] = [
    { label: "Business Formation", value: "business_formation" },
    { label: "Tax Document", value: "tax_document" },
    { label: "Ownership Information", value: "ownership_information" },
    { label: "Shareholder Register", value: "shareholder_register" },
    { label: "Proof of Nature of Business", value: "proof_of_nature_of_business" },
    { label: "Bank Statement", value: "bank_statement" },
    { label: "Proof of Address", value: "proof_of_address" },
    { label: "Proof of Source of Funds", value: "proof_of_source_of_funds" },
    { label: "Articles of Incorporation", value: "articles_of_incorporation" },
    { label: "Memorandum of Association", value: "memorandum_of_association" },
    { label: "Flow of Funds", value: "flow_of_funds" },
    { label: "Compliance Screening", value: "compliance_screening" },
    { label: "Licensed Vendors Attestation", value: "licensed_vendors_attestation" },
    { label: "Proof of Licensure", value: "proof_of_licensure" },
    { label: "Other", value: "other" },
];

/**
 * Business Associated-Person Document Kind Enums
 * Offramp v2 Tenant Spec (docs/offramp-v2-tenant-enums.md:L176-L181)
 */
export const PERSON_DOCUMENT_KIND_OPTIONS: KybEnumOption[] = [
    { label: "Passport", value: "passport" },
    { label: "Government ID Front", value: "identity_card_front" },
    { label: "Government ID Back", value: "identity_card_back" },
    { label: "Selfie", value: "selfie" },
    { label: "Proof of Address", value: "proof_of_address" },
];

/**
 * risk.primarySourceOfFunds / operations.primarySourceOfFunds Enums
 * Offramp v2 Tenant Spec (docs/offramp-v2-tenant-enums.md:L39-L53)
 */
export const SOURCE_OF_FUNDS_OPTIONS: KybEnumOption[] = [
    { label: "Employment / Salary", value: "employment" },
    { label: "Savings", value: "savings" },
    { label: "Winnings", value: "winnings" },
    { label: "Marital / Spousal", value: "marital" },
    { label: "Real Estate", value: "real_estate" },
    { label: "Trust", value: "trust" },
    { label: "Investment", value: "investment" },
    { label: "Company", value: "company" },
    { label: "Company Capital", value: "company_capital" },
    { label: "Loan", value: "loan" },
    { label: "Private Capital", value: "private_capital" },
    { label: "Grant", value: "grant" },
    { label: "Other", value: "other" },
];

/**
 * risk.accountPurpose / operations.accountPurpose Enums
 * Offramp v2 Tenant Spec (docs/offramp-v2-tenant-enums.md:L55-L65)
 */
export const ACCOUNT_PURPOSE_OPTIONS: KybEnumOption[] = [
    { label: "Personal Use", value: "personal_use" },
    { label: "Business Operations", value: "business_operations" },
    { label: "Investment", value: "investment" },
    { label: "Crypto Investment", value: "crypto_investment" },
    { label: "Savings", value: "savings" },
    { label: "Remittances", value: "remittances" },
    { label: "Payroll", value: "payroll" },
    { label: "Treasury Management", value: "treasury_management" },
    { label: "Other", value: "other" },
];

/**
 * jurisdictions.highRiskActivities / operations.highRiskActivities Enums
 * Offramp v2 Tenant Spec (docs/offramp-v2-tenant-enums.md:L75-L82)
 */
export const HIGH_RISK_ACTIVITY_OPTIONS: KybEnumOption[] = [
    { label: "Adult Entertainment", value: "adult_entertainment" },
    { label: "Drugs", value: "drugs" },
    { label: "Firearms", value: "firearms" },
    { label: "Gambling", value: "gambling" },
    { label: "Marijuana", value: "marijuana" },
    { label: "Crypto Mixing", value: "crypto_mixing" },
];

/**
 * counterparties.counterparties / vendorsAndCounterparties Enums
 * Offramp v2 Tenant Spec (docs/offramp-v2-tenant-enums.md:L84-L92)
 */
export const COUNTERPARTY_OPTIONS: KybEnumOption[] = [
    { label: "Self (own accounts)", value: "self_transactions" },
    { label: "Merchants / Suppliers", value: "merchants_suppliers" },
    { label: "Customers", value: "customers" },
    { label: "Employees", value: "employees" },
    { label: "Contractors", value: "contractors" },
    { label: "Friends", value: "friends" },
    { label: "Family", value: "family" },
];

/**
 * governmentId.type / govIdKind Enums
 * Offramp v2 Tenant Spec (docs/offramp-v2-tenant-enums.md:L148-L155)
 */
export const GOV_ID_KIND_OPTIONS: KybEnumOption[] = [
    { label: "Passport", value: "passport" },
    { label: "Driver's License", value: "drivers_license" },
    { label: "National ID", value: "national_id" },
    { label: "Residence Permit", value: "residence_permit" },
    { label: "Voter's Card", value: "voters_card" },
    { label: "Other", value: "other" },
];

/** Helper to look up backend enum value from display label or value */
export function getKybEnumValue(options: KybEnumOption[], valueOrLabel: string): string {
    if (!valueOrLabel) return "";
    const match = options.find((o) => o.label === valueOrLabel || o.value === valueOrLabel);
    return match ? match.value : valueOrLabel;
}

/** Helper to look up display label from backend enum value or label */
export function getKybEnumLabel(options: KybEnumOption[], valueOrLabel: string): string {
    if (!valueOrLabel) return "";
    const match = options.find((o) => o.value === valueOrLabel || o.label === valueOrLabel);
    return match ? match.label : valueOrLabel;
}
