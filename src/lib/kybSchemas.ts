import { z } from "zod";
import { toCountryIso2 } from "./kycEnums";

/**
 * Zod validation schema for Step 1: Business Details
 */
export const step1BusinessSchema = z
  .object({
    legalName: z.string().trim().min(1, "Legal name is required"),
    tradeName: z.string().trim().min(1, "Trade name (DBA) is required"),
    entityType: z.string().min(1, "Entity type is required"),
    industry: z.string().min(1, "Industry (NAICS code) is required"),
    countryOfRegistration: z.string().min(1, "Country of registration is required"),
    stateOfIncorporation: z.string().trim().min(1, "State of incorporation is required"),
    registrationNumber: z.string().trim().min(1, "Registration number is required"),
    taxId: z.string().trim().min(1, "Tax ID is required"),
    formationDate: z.string().min(1, "Formation date is required"),
    hasNoWebsite: z.boolean().default(false),
    website: z.string().optional(),
    marketingStrategy: z.string().optional(),
    businessDescription: z
      .string()
      .trim()
      .min(350, "Business description must be at least 350 characters long"),
    isDao: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    const cleanWebsite = data.website ? data.website.trim() : "";
    if (!data.hasNoWebsite && (!cleanWebsite || cleanWebsite === "https://")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please enter a website name or check 'This entity has no website'. Please fill at least one option.",
        path: ["website"],
      });
    }
    if (data.hasNoWebsite) {
      const cleanStrat = data.marketingStrategy ? data.marketingStrategy.trim() : "";
      if (cleanStrat.length < 350) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Marketing strategy must contain at least 350 characters when entity has no website",
          path: ["marketingStrategy"],
        });
      }
    }
  });

/**
 * Zod validation schema for Step 2: Registered Addresses
 */
export const step2AddressesSchema = z.object({
  addressLine1: z.string().trim().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  city: z.string().trim().min(1, "City is required"),
  stateRegion: z.string().optional(),
  postalCode: z.string().optional(),
});

export interface RequirementsCheck {
  state: string;
  postal_code: string;
}

export const validateKybAddresses = (data: any, reqs?: RequirementsCheck) => {
  const errors: Record<string, string> = {};
  if (!data.addressLine1 || !data.addressLine1.trim()) errors.addressLine1 = "Address line 1 is required";
  if (!data.country || !data.country.trim()) errors.country = "Country is required";
  if (!data.city || !data.city.trim()) errors.city = "City is required";
  if (reqs?.state === "required" && (!data.stateRegion || !data.stateRegion.trim())) {
    errors.stateRegion = "State / region is required";
  }
  if (reqs?.postal_code === "required" && (!data.postalCode || !data.postalCode.trim())) {
    errors.postalCode = "Postal code is required";
  }
  return errors;
};

/**
 * Zod validation schema for Step 3: Contact Details
 */
export const step3ContactSchema = z.object({
  email: z.string().trim().email("Valid business email is required"),
  phoneCountry: z.string().min(1, "Phone country is required"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .regex(/^[0-9\s\-()]{7,15}$/, "Enter number without country code (7-15 digits)"),
});

/**
 * Zod validation schema for Step 4: Operations & Risk
 */
export const step4OperationsSchema = z.object({
  opJurisdictions: z
    .array(z.string())
    .min(1, "Select at least one operating jurisdiction"),
  primarySourceOfFunds: z.string().min(1, "Primary source of funds is required"),
  regulatoryStatus: z.string().min(1, "Regulatory status is required"),
  sourceOfFundsDescription: z
    .string()
    .trim()
    .min(80, "Source of funds description must contain at least 80 characters"),
  purposeOfFundMovement: z.string().min(1, "Purpose of fund movement is required"),
  fundMovementDescription: z
    .string()
    .trim()
    .min(1, "Description of fund movement is required"),
  selectedRiskAttestations: z.array(z.string()).optional(),
  selectedVerticals: z.array(z.string()).optional(),
});

/**
 * Zod validation schema for Step 5: Volume Projections
 */
export const step5VolumesSchema = z.object({
  estimatedMonthlyRevenueUsd: z
    .string()
    .trim()
    .min(1, "Estimated monthly revenue is required"),
  expectedReceivePayCount: z
    .string()
    .trim()
    .min(1, "Expected receive count is required"),
  expectedSendPayCount: z
    .string()
    .trim()
    .min(1, "Expected send count is required"),
  totalUsdSendReceive: z
    .string()
    .trim()
    .min(1, "Total USD send/receive value is required"),
  totalUsdMonthly: z
    .string()
    .trim()
    .min(1, "Total monthly USD value is required"),
  depositInvestmentsAmount: z.string().optional(),
  withdrawInvestmentsAmount: z.string().optional(),
  depositCryptoInvestmentsAmount: z.string().optional(),
  withdrawCryptoInvestmentsAmount: z.string().optional(),
});

/**
 * Zod validation schema for Step 6: Counterparties
 */
export const step6CounterpartiesSchema = z.object({
  selectedCounterparties: z
    .array(z.string())
    .min(1, "Select at least one counterparty type"),
});

/**
 * Zod validation schema for Step 7: Associated Persons (People)
 */
const docItemSchema = z
  .object({
    file: z.any().nullable().optional(),
    uploadedName: z.string().optional(),
    isUploaded: z.boolean().optional(),
  })
  .optional();

export const personSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required"),
    middleName: z.string().trim().optional(),
    lastName: z.string().trim().min(1, "Last name is required"),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    email: z.string().trim().min(1, "Email address is required").email("Valid email address is required"),
    phoneCountryCode: z.string().min(1, "Phone country is required"),
    phone: z.string().trim().min(1, "Phone number is required"),
    taxId: z.string().trim().min(1, "Tax ID is required"),
    nationality: z.string().min(1, "Nationality is required"),
    citizenship: z.string().min(1, "Citizenship is required"),
    ownershipPercent: z.string().trim().min(1, "Ownership percent is required"),
    title: z.string().trim().min(1, "Title is required"),
    relationshipEstablishedAt: z
      .string()
      .min(1, "Relationship start date is required"),
    roles: z.array(z.string()).min(1, "Select at least one role"),
    addressLine1: z.string().trim().min(1, "Address line 1 is required"),
    addressLine2: z.string().trim().optional(),
    country: z.string().min(1, "Country of residence is required"),
    city: z.string().trim().min(1, "City is required"),
    stateRegion: z.string().optional(),
    postalCode: z.string().optional(),
    govIdKind: z.string().min(1, "Government ID type is required"),
    govIdNumber: z.string().trim().min(1, "Government ID number is required"),
    govIdCountry: z.string().min(1, "Government ID issuing country is required"),
    docs: z
      .object({
        idFront: docItemSchema,
        idBack: docItemSchema,
        passport: docItemSchema,
        selfie: docItemSchema,
        proofOfAddress: docItemSchema,
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.govIdKind === "passport") {
      const passportUploaded = Boolean(
        data.docs?.passport?.isUploaded ||
          data.docs?.passport?.file ||
          data.docs?.idFront?.isUploaded ||
          data.docs?.idFront?.file
      );
      if (!passportUploaded) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passport image upload is required",
          path: ["docs", "passport"],
        });
      }
    } else {
      if (!data.docs?.idFront?.isUploaded && !data.docs?.idFront?.file) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Government ID front-image upload is required",
          path: ["docs", "idFront"],
        });
      }
      if (!data.docs?.idBack?.isUploaded && !data.docs?.idBack?.file) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "ID back image is required",
          path: ["docs", "idBack"],
        });
      }
    }
    if (!data.docs?.selfie?.isUploaded && !data.docs?.selfie?.file) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selfie image is required",
        path: ["docs", "selfie"],
      });
    }
    if (!data.docs?.proofOfAddress?.isUploaded && !data.docs?.proofOfAddress?.file) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Proof of address is required",
        path: ["docs", "proofOfAddress"],
      });
    }
  });

export const step7PeopleSchema = z
  .object({
    associatedPersons: z.array(personSchema).min(1, "At least one associated person is required"),
  })
  .superRefine((data, ctx) => {
    const persons = data.associatedPersons ?? [];

    // 1. At least one person with Beneficial Owner role
    const hasBeneficialOwner = persons.some((p) => (p.roles || []).includes("beneficial_owner"));
    if (!hasBeneficialOwner) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one person must have the Beneficial Owner role.",
        path: ["beneficial_owner_required"],
      });
    }

    // 2. At least one person with Authorized Signer role
    const hasSigner = persons.some((p) => (p.roles || []).includes("authorized_signer"));
    if (!hasSigner) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one person must have the Authorized Signer role.",
        path: ["authorized_signer_required"],
      });
    }

    // 3. At least one person with Control Person role
    const hasControl = persons.some((p) => (p.roles || []).includes("control_person"));
    if (!hasControl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one person must have the Control Person role.",
        path: ["control_person_required"],
      });
    }

    // 4. Beneficial-owner ownership percentages must sum to no more than 100
    const totalBeneficialOwnership = persons.reduce((sum, p) => {
      const isBO = (p.roles || []).includes("beneficial_owner");
      if (!isBO) return sum;
      const val = parseFloat(p.ownershipPercent || "0");
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    if (totalBeneficialOwnership > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Beneficial-owner ownership percentages must sum to no more than 100% (currently ${totalBeneficialOwnership}%).`,
        path: ["ownership_total"],
      });
    }
  });


/**
 * Zod validation schema for Step 8: Documents
 */
export const step8DocumentsSchema = z.object({
  documents: z.record(z.any()).optional(),
});

/**
 * Zod validation schema for Step 9: Review & Submit
 */
export const step9ReviewSchema = z.object({
  agreeTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the platform terms and conditions" }),
  }),
  agreeAccurate: z.literal(true, {
    errorMap: () => ({ message: "You must attest that the submitted information is accurate" }),
  }),
  enableUsdCapabilities: z.boolean().default(true),
});
