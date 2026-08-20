import { getPhoneCode } from "@/lib/countries";

/**
 * Gets the international dial code for a given country name or direct dial code.
 *
 * @param phoneCountry Country name (e.g. "India"), ISO 2-letter code (e.g. "IN"), or dial code string (e.g. "+91")
 * @returns The dial code string starting with "+", or empty string if not found.
 */
export function getDialCode(phoneCountry?: string): string {
  if (!phoneCountry) return "";
  const trimmed = phoneCountry.trim();
  if (trimmed.startsWith("+")) return trimmed;

  return getPhoneCode(trimmed);
}

/**
 * Formats a phone number with the appropriate country dial code if not already included.
 *
 * @param phone The raw phone number string or number.
 * @param phoneCountry The country name or dial code string or ISO code.
 * @returns The formatted phone number with dial code prefix.
 */
export function formatPhoneNumber(phone?: string | number, phoneCountry?: string): string {
  if (phone === undefined || phone === null) return "";
  const rawPhone = String(phone).trim();
  if (!rawPhone) return "";
  if (rawPhone.startsWith("+")) return rawPhone;

  const dialCode = getDialCode(phoneCountry);
  return dialCode ? `${dialCode}${rawPhone}` : rawPhone;
}

