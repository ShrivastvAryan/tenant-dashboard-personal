import { z } from "zod";

export const step1IdentitySchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().trim().min(1, "Last name is required"),
  dob: z.string().min(1, "Date of birth is required"),
  countryOfResidence: z.string().min(1, "Country of residence is required"),
  nationality: z.string().min(1, "Nationality is required"),
  citizenship: z.string().min(1, "Citizenship is required"),
  taxId: z.string().trim().min(1, "Tax identification number is required"),
});

export const step2AddressesSchema = z
  .object({
    addressLine1: z.string().trim().min(1, "Address line 1 is required"),
    addressLine2: z.string().optional(),
    country: z.string().min(1, "Country is required"),
    city: z.string().trim().min(1, "City is required"),
    stateRegion: z.string().optional(),
    postalCode: z.string().optional(),
    differentMailingAddress: z.boolean().default(false),
    mailingAddressLine1: z.string().optional(),
    mailingAddressLine2: z.string().optional(),
    mailingCountry: z.string().optional(),
    mailingCity: z.string().optional(),
    mailingStateRegion: z.string().optional(),
    mailingPostalCode: z.string().optional(),
  });

export interface RequirementsCheck {
  state: string;
  postal_code: string;
}

export const validateKycAddresses = (
  data: any,
  resReqs?: RequirementsCheck,
  mailingReqs?: RequirementsCheck
) => {
  const errors: Record<string, string> = {};
  if (!data.addressLine1 || !data.addressLine1.trim()) {
    errors.addressLine1 = "Address line 1 is required";
  }
  if (!data.country || !data.country.trim()) {
    errors.country = "Country is required";
  }
  if (!data.city || !data.city.trim()) {
    errors.city = "City is required";
  }
  if (resReqs?.state === "required" && (!data.stateRegion || !data.stateRegion.trim())) {
    errors.stateRegion = "State / region is required";
  }
  if (resReqs?.postal_code === "required" && (!data.postalCode || !data.postalCode.trim())) {
    errors.postalCode = "Postal code is required";
  }

  if (data.differentMailingAddress) {
    if (!data.mailingAddressLine1 || !data.mailingAddressLine1.trim()) {
      errors.mailingAddressLine1 = "Mailing address line 1 is required";
    }
    if (!data.mailingCountry || !data.mailingCountry.trim()) {
      errors.mailingCountry = "Mailing country is required";
    }
    if (!data.mailingCity || !data.mailingCity.trim()) {
      errors.mailingCity = "Mailing city is required";
    }
    if (mailingReqs?.state === "required" && (!data.mailingStateRegion || !data.mailingStateRegion.trim())) {
      errors.mailingStateRegion = "Mailing state/region is required";
    }
    if (mailingReqs?.postal_code === "required" && (!data.mailingPostalCode || !data.mailingPostalCode.trim())) {
      errors.mailingPostalCode = "Mailing postal code is required";
    }
  }

  return errors;
};

export const step3ContactSchema = z.object({
  email: z.string().trim().email("Valid email address is required"),
  phoneCountry: z.string().min(1, "Phone country is required"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .regex(/^[0-9\s\-()]{7,15}$/, "Enter number without country code (7-15 digits)"),
});

export const step4EmploymentSchema = z.object({
  employmentStatus: z.string().min(1, "Employment status is required"),
  occupation: z.string().trim().min(1, "Occupation is required"),
});

export const step5RiskSchema = z.object({
  primarySourceOfFunds: z.string().min(1, "Primary source of funds is required"),
  accountPurpose: z.string().min(1, "Account purpose is required"),
  actingOnBehalfOfSomeoneElse: z.boolean().default(false),
  isPep: z.boolean().default(false),
});

export const step6VolumesSchema = z.object({
  fiatPayInsCount: z.string().regex(/^\d+$/, "Pay-ins count must be a number"),
  fiatPayoutsCount: z.string().regex(/^\d+$/, "Payouts count must be a number"),
  monthlyFiatVolumeUsd: z.string().min(1, "Monthly fiat volume is required"),
  cryptoPayInsCount: z.string().optional(),
  cryptoPayoutsCount: z.string().optional(),
  monthlyCryptoVolumeUsd: z.string().optional(),
});

export const step7JurisdictionsSchema = z.object({
  jurisdictionCountries: z.array(z.string()).min(1, "Select at least one jurisdiction country"),
  selectedHighRiskActivities: z.array(z.string()).optional(),
  selectedCounterparties: z.array(z.string()).min(1, "Select at least one vendor or counterparty"),
});

export const step8DocumentsSchema = z
  .object({
    idType: z.string().min(1, "Government ID type is required"),
    idNumber: z.string().trim().min(1, "ID number is required"),
    issuingCountry: z.string().min(1, "Issuing country is required"),
    hasGovtIdFront: z.boolean().default(false),
    hasGovtIdBack: z.boolean().default(false),
    hasPassport: z.boolean().default(false),
    hasSelfie: z.boolean().default(false),
    hasProofOfAddress: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.idType === "passport") {
      if (!data.hasPassport && !data.hasGovtIdFront) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passport image is required. Please select or upload your passport.",
          path: ["hasPassport"],
        });
      }
    } else {
      if (!data.hasGovtIdFront) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "ID front image is required. Please select or upload the front image.",
          path: ["hasGovtIdFront"],
        });
      }
      if (!data.hasGovtIdBack) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "ID back image is required. Please select or upload the back image.",
          path: ["hasGovtIdBack"],
        });
      }
    }
    if (!data.hasSelfie) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selfie document is required. Please select or upload a selfie.",
        path: ["hasSelfie"],
      });
    }
    if (!data.hasProofOfAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Proof of address document is required. Please select or upload a proof of address.",
        path: ["hasProofOfAddress"],
      });
    }
  });

export const step9ReviewSchema = z.object({
  agreeTerms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the platform terms and conditions" }),
  }),
  agreeAccurate: z.literal(true, {
    errorMap: () => ({ message: "You must declare that the information is accurate" }),
  }),
  enableUsdCapabilities: z.boolean().default(true),
});
