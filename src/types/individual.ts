export interface KycAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface KycAddresses {
  residential: KycAddress;
  mailing: KycAddress;
}

export interface KycIdentity {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string; // Format: "YYYY-MM-DD"
  nationality: string;
  citizenship: string;
  countryOfResidence: string;
  taxIdentificationNumber: string;
}

export interface KycContact {
  email: string;
  phone?: string;
  phoneCountryCode?: string;
}

export interface KycEmployment {
  employmentStatus?: string;
  occupation: string;
  employerName: string;
}

export interface KycRisk {
  primarySourceOfFunds?: string;
  accountPurpose?: string;
  actingAsIntermediary: boolean;
  pepStatus: boolean;
}

export interface KycVolumes {
  usdValueOfFiat: number;
  usdValueOfCrypto: number;
  monthlyDeposits: number;
  monthlyWithdrawals: number;
  monthlyCryptoDeposits: number;
  monthlyCryptoWithdrawals: number;
  monthlyInvestmentDepositUsd: number;
  monthlyInvestmentWithdrawalUsd: number;
  monthlyCryptoInvestmentDepositUsd: number;
  monthlyCryptoInvestmentWithdrawalUsd: number;
  expectedMonthlyPaymentsUsd: number;
}

export interface KycJurisdictions {
  fundsSendReceiveJurisdictions: string[];
  highRiskActivities: string[];
  vendorsAndCounterparties: string[];
}

export interface KycAttestations {
  termsAndConditionsAccepted: boolean;
  informationAttested: boolean;
}

export interface GovernmentIssuedIdentification {
  kind: string;
  number: string;
  country: string;
}

export interface KycDocuments {
  governmentIssuedIdentification?: GovernmentIssuedIdentification;
}

export interface KycProfile {
  identity: KycIdentity;
  addresses: KycAddresses;
  contact: KycContact;
  employment: KycEmployment;
  risk: KycRisk;
  volumes: KycVolumes;
  jurisdictions: KycJurisdictions;
  attestations: KycAttestations;
  documents?: KycDocuments;
  usdCapabilitiesRequested?: boolean;
}

export interface SaveKycData {
  email: string;
  country: string;
  corridor: string;
  profile: KycProfile;
}