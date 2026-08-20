export interface KybAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface KybAddresses {
  registered: KybAddress;
  physical: KybAddress;
}

export interface KybBusiness {
  legalName: string;
  tradeName?: string;
  transliteratedLegalName?: string;
  entityType: string;
  industry: string;
  description: string;
  registrationNumber: string;
  taxId: string;
  countryOfRegistration: string;
  stateOfIncorporation: string;
  formationDate: string;
  website?: string;
  noWebsite?: boolean;
  marketingStrategy?: string;
  isDao: boolean;
}

export interface KybContact {
  email: string;
  phone?: string;
  phoneCountryCode?: string;
}

export interface KybOperations {
  businessJurisdictions: string[];
  fundsMovementJurisdictions: string[];
  primarySourceOfFunds?: string;
  primarySourceOfFundsDescription: string;
  regulatedStatus?: string;
  accountPurpose?: string;
  actingAsIntermediary: boolean;
  conductsMoneyServices: boolean;
  operatesInProhibitedCountries: boolean;
  highRiskActivities: string[];
  hasComplexOwnership: boolean;
}

export interface KybVolumes {
  monthlyDeposits: number;
  monthlyWithdrawals: number;
  monthlyCryptoDeposits: number;
  monthlyCryptoWithdrawals: number;
  monthlyInvestmentDepositUsd: number;
  monthlyInvestmentWithdrawalUsd: number;
  monthlyCryptoInvestmentDepositUsd: number;
  monthlyCryptoInvestmentWithdrawalUsd: number;
  usdValueOfFiat: number;
  usdValueOfCrypto: number;
  expectedMonthlyPaymentsUsd: number;
  estimatedAnnualRevenueUsd: number;
}

export interface KybCounterparties {
  counterparties: string[];
}

export interface KybAttestations {
  termsAndConditionsAccepted: boolean;
  informationAttested: boolean;
}

export interface KybAssociatedPerson {
  personRef?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone?: string;
  phoneCountryCode?: string;
  dateOfBirth: string;
  nationality: string;
  citizenship: string;
  address: KybAddress;
  taxId: string;
  ownershipPercent: number;
  roles: string[];
  title: string;
  relationshipEstablishedAt: string;
  govIdKind?: string;
  govIdNumber: string;
  govIdCountry: string;
}

export interface KybProfile {
  business: KybBusiness;
  addresses: KybAddresses;
  contact: KybContact;
  operations: KybOperations;
  volumes: KybVolumes;
  counterparties: KybCounterparties;
  attestations: KybAttestations;
  associatedPersons: KybAssociatedPerson[];
}

export interface SaveKybData {
  email: string;
  country: string;
  corridor: string;
  profile: KybProfile;
}