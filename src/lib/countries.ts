export interface Country {
  code: string; // ISO 3166-1 alpha-2 code
  name: string;
  phoneCode?: string; // Country phone calling code (e.g. "+1", "+91")
}

/**
 * List of ISO 3166-1 alpha-2 country codes blocked according to Offramp v2 spec
 */
export const BLOCKED_COUNTRY_CODES: readonly string[] = [
  "AF", // Afghanistan
  "BY", // Belarus
  "CF", // Central African Republic
  "CD", // Democratic Republic of the Congo
  "CG", // Republic of the Congo
  "CU", // Cuba
  "GN", // Guinea
  "IR", // Iran
  "IQ", // Iraq
  "LY", // Libya
  "ML", // Mali
  "MM", // Myanmar
  "KP", // North Korea
  "RU", // Russia
  "SO", // Somalia
  "SS", // South Sudan
  "SD", // Sudan
  "SY", // Syria
  "VE", // Venezuela
  "YE", // Yemen
  "PS", // Palestine
];

/**
 * Blocked US states
 */
export const BLOCKED_US_STATES: readonly string[] = ["NY", "AK"];

/**
 * Blocked Ukraine regions
 */
export const BLOCKED_UKRAINE_REGIONS: readonly string[] = ["Crimea", "Donetsk", "Luhansk"];

/**
 * Full master list of ISO 3166-1 alpha-2 countries
 */
export const ALL_COUNTRIES: readonly Country[] = [
  { code: "AD", name: "Andorra", phoneCode: "+376" },
  { code: "AE", name: "United Arab Emirates", phoneCode: "+971" },
  { code: "AF", name: "Afghanistan", phoneCode: "+93" },
  { code: "AG", name: "Antigua and Barbuda", phoneCode: "+1268" },
  { code: "AI", name: "Anguilla", phoneCode: "+1264" },
  { code: "AL", name: "Albania", phoneCode: "+355" },
  { code: "AM", name: "Armenia", phoneCode: "+374" },
  { code: "AO", name: "Angola", phoneCode: "+244" },
  { code: "AQ", name: "Antarctica", phoneCode: "+672" },
  { code: "AR", name: "Argentina", phoneCode: "+54" },
  { code: "AS", name: "American Samoa", phoneCode: "+1684" },
  { code: "AT", name: "Austria", phoneCode: "+43" },
  { code: "AU", name: "Australia", phoneCode: "+61" },
  { code: "AW", name: "Aruba", phoneCode: "+297" },
  { code: "AX", name: "Åland Islands", phoneCode: "+358" },
  { code: "AZ", name: "Azerbaijan", phoneCode: "+994" },
  { code: "BA", name: "Bosnia and Herzegovina", phoneCode: "+387" },
  { code: "BB", name: "Barbados", phoneCode: "+1246" },
  { code: "BD", name: "Bangladesh", phoneCode: "+880" },
  { code: "BE", name: "Belgium", phoneCode: "+32" },
  { code: "BF", name: "Burkina Faso", phoneCode: "+226" },
  { code: "BG", name: "Bulgaria", phoneCode: "+359" },
  { code: "BH", name: "Bahrain", phoneCode: "+973" },
  { code: "BI", name: "Burundi", phoneCode: "+257" },
  { code: "BJ", name: "Benin", phoneCode: "+229" },
  { code: "BL", name: "Saint Barthélemy", phoneCode: "+590" },
  { code: "BM", name: "Bermuda", phoneCode: "+1441" },
  { code: "BN", name: "Brunei Darussalam", phoneCode: "+673" },
  { code: "BO", name: "Bolivia", phoneCode: "+591" },
  { code: "BQ", name: "Bonaire, Sint Eustatius and Saba", phoneCode: "+599" },
  { code: "BR", name: "Brazil", phoneCode: "+55" },
  { code: "BS", name: "Bahamas", phoneCode: "+1242" },
  { code: "BT", name: "Bhutan", phoneCode: "+975" },
  { code: "BV", name: "Bouvet Island", phoneCode: "+47" },
  { code: "BW", name: "Botswana", phoneCode: "+267" },
  { code: "BY", name: "Belarus", phoneCode: "+375" },
  { code: "BZ", name: "Belize", phoneCode: "+501" },
  { code: "CA", name: "Canada", phoneCode: "+1" },
  { code: "CC", name: "Cocos (Keeling) Islands", phoneCode: "+61" },
  { code: "CD", name: "Congo (Democratic Republic of the)", phoneCode: "+243" },
  { code: "CF", name: "Central African Republic", phoneCode: "+236" },
  { code: "CG", name: "Congo (Republic of the)", phoneCode: "+242" },
  { code: "CH", name: "Switzerland", phoneCode: "+41" },
  { code: "CI", name: "Côte d'Ivoire", phoneCode: "+225" },
  { code: "CK", name: "Cook Islands", phoneCode: "+682" },
  { code: "CL", name: "Chile", phoneCode: "+56" },
  { code: "CM", name: "Cameroon", phoneCode: "+237" },
  { code: "CN", name: "China", phoneCode: "+86" },
  { code: "CO", name: "Colombia", phoneCode: "+57" },
  { code: "CR", name: "Costa Rica", phoneCode: "+506" },
  { code: "CU", name: "Cuba", phoneCode: "+53" },
  { code: "CV", name: "Cabo Verde", phoneCode: "+238" },
  { code: "CW", name: "Curaçao", phoneCode: "+599" },
  { code: "CX", name: "Christmas Island", phoneCode: "+61" },
  { code: "CY", name: "Cyprus", phoneCode: "+357" },
  { code: "CZ", name: "Czechia", phoneCode: "+420" },
  { code: "DE", name: "Germany", phoneCode: "+49" },
  { code: "DJ", name: "Djibouti", phoneCode: "+253" },
  { code: "DK", name: "Denmark", phoneCode: "+45" },
  { code: "DM", name: "Dominica", phoneCode: "+1767" },
  { code: "DO", name: "Dominican Republic", phoneCode: "+1809" },
  { code: "DZ", name: "Algeria", phoneCode: "+213" },
  { code: "EC", name: "Ecuador", phoneCode: "+593" },
  { code: "EE", name: "Estonia", phoneCode: "+372" },
  { code: "EG", name: "Egypt", phoneCode: "+20" },
  { code: "EH", name: "Western Sahara", phoneCode: "+212" },
  { code: "ER", name: "Eritrea", phoneCode: "+291" },
  { code: "ES", name: "Spain", phoneCode: "+34" },
  { code: "ET", name: "Ethiopia", phoneCode: "+251" },
  { code: "FI", name: "Finland", phoneCode: "+358" },
  { code: "FJ", name: "Fiji", phoneCode: "+679" },
  { code: "FK", name: "Falkland Islands", phoneCode: "+500" },
  { code: "FM", name: "Micronesia", phoneCode: "+691" },
  { code: "FO", name: "Faroe Islands", phoneCode: "+298" },
  { code: "FR", name: "France", phoneCode: "+33" },
  { code: "GA", name: "Gabon", phoneCode: "+241" },
  { code: "GB", name: "United Kingdom", phoneCode: "+44" },
  { code: "GD", name: "Grenada", phoneCode: "+1473" },
  { code: "GE", name: "Georgia", phoneCode: "+995" },
  { code: "GF", name: "French Guiana", phoneCode: "+594" },
  { code: "GG", name: "Guernsey", phoneCode: "+44" },
  { code: "GH", name: "Ghana", phoneCode: "+233" },
  { code: "GI", name: "Gibraltar", phoneCode: "+350" },
  { code: "GL", name: "Greenland", phoneCode: "+299" },
  { code: "GM", name: "Gambia", phoneCode: "+220" },
  { code: "GN", name: "Guinea", phoneCode: "+224" },
  { code: "GP", name: "Guadeloupe", phoneCode: "+590" },
  { code: "GQ", name: "Equatorial Guinea", phoneCode: "+240" },
  { code: "GR", name: "Greece", phoneCode: "+30" },
  { code: "GS", name: "South Georgia and South Sandwich Islands", phoneCode: "+500" },
  { code: "GT", name: "Guatemala", phoneCode: "+502" },
  { code: "GU", name: "Guam", phoneCode: "+1671" },
  { code: "GW", name: "Guinea-Bissau", phoneCode: "+245" },
  { code: "GY", name: "Guyana", phoneCode: "+592" },
  { code: "HK", name: "Hong Kong", phoneCode: "+852" },
  { code: "HM", name: "Heard Island and McDonald Islands", phoneCode: "+672" },
  { code: "HN", name: "Honduras", phoneCode: "+504" },
  { code: "HR", name: "Croatia", phoneCode: "+385" },
  { code: "HT", name: "Haiti", phoneCode: "+509" },
  { code: "HU", name: "Hungary", phoneCode: "+36" },
  { code: "ID", name: "Indonesia", phoneCode: "+62" },
  { code: "IE", name: "Ireland", phoneCode: "+353" },
  { code: "IL", name: "Israel", phoneCode: "+972" },
  { code: "IM", name: "Isle of Man", phoneCode: "+44" },
  { code: "IN", name: "India", phoneCode: "+91" },
  { code: "IO", name: "British Indian Ocean Territory", phoneCode: "+246" },
  { code: "IQ", name: "Iraq", phoneCode: "+964" },
  { code: "IR", name: "Iran", phoneCode: "+98" },
  { code: "IS", name: "Iceland", phoneCode: "+354" },
  { code: "IT", name: "Italy", phoneCode: "+39" },
  { code: "JE", name: "Jersey", phoneCode: "+44" },
  { code: "JM", name: "Jamaica", phoneCode: "+1876" },
  { code: "JO", name: "Jordan", phoneCode: "+962" },
  { code: "JP", name: "Japan", phoneCode: "+81" },
  { code: "KE", name: "Kenya", phoneCode: "+254" },
  { code: "KG", name: "Kyrgyzstan", phoneCode: "+996" },
  { code: "KH", name: "Cambodia", phoneCode: "+855" },
  { code: "KI", name: "Kiribati", phoneCode: "+686" },
  { code: "KM", name: "Comoros", phoneCode: "+269" },
  { code: "KN", name: "Saint Kitts and Nevis", phoneCode: "+1869" },
  { code: "KP", name: "Korea (North)", phoneCode: "+850" },
  { code: "KR", name: "Korea (South)", phoneCode: "+82" },
  { code: "KW", name: "Kuwait", phoneCode: "+965" },
  { code: "KY", name: "Cayman Islands", phoneCode: "+1345" },
  { code: "KZ", name: "Kazakhstan", phoneCode: "+7" },
  { code: "LA", name: "Laos", phoneCode: "+856" },
  { code: "LB", name: "Lebanon", phoneCode: "+961" },
  { code: "LC", name: "Saint Lucia", phoneCode: "+1758" },
  { code: "LI", name: "Liechtenstein", phoneCode: "+423" },
  { code: "LK", name: "Sri Lanka", phoneCode: "+94" },
  { code: "LR", name: "Liberia", phoneCode: "+231" },
  { code: "LS", name: "Lesotho", phoneCode: "+266" },
  { code: "LT", name: "Lithuania", phoneCode: "+370" },
  { code: "LU", name: "Luxembourg", phoneCode: "+352" },
  { code: "LV", name: "Latvia", phoneCode: "+371" },
  { code: "LY", name: "Libya", phoneCode: "+218" },
  { code: "MA", name: "Morocco", phoneCode: "+212" },
  { code: "MC", name: "Monaco", phoneCode: "+377" },
  { code: "MD", name: "Moldova", phoneCode: "+373" },
  { code: "ME", name: "Montenegro", phoneCode: "+382" },
  { code: "MF", name: "Saint Martin (French part)", phoneCode: "+590" },
  { code: "MG", name: "Madagascar", phoneCode: "+261" },
  { code: "MH", name: "Marshall Islands", phoneCode: "+692" },
  { code: "MK", name: "North Macedonia", phoneCode: "+389" },
  { code: "ML", name: "Mali", phoneCode: "+223" },
  { code: "MM", name: "Myanmar", phoneCode: "+95" },
  { code: "MN", name: "Mongolia", phoneCode: "+976" },
  { code: "MO", name: "Macao", phoneCode: "+853" },
  { code: "MP", name: "Northern Mariana Islands", phoneCode: "+1670" },
  { code: "MQ", name: "Martinique", phoneCode: "+596" },
  { code: "MR", name: "Mauritania", phoneCode: "+222" },
  { code: "MS", name: "Montserrat", phoneCode: "+1664" },
  { code: "MT", name: "Malta", phoneCode: "+356" },
  { code: "MU", name: "Mauritius", phoneCode: "+230" },
  { code: "MV", name: "Maldives", phoneCode: "+960" },
  { code: "MW", name: "Malawi", phoneCode: "+265" },
  { code: "MX", name: "Mexico", phoneCode: "+52" },
  { code: "MY", name: "Malaysia", phoneCode: "+60" },
  { code: "MZ", name: "Mozambique", phoneCode: "+258" },
  { code: "NA", name: "Namibia", phoneCode: "+264" },
  { code: "NC", name: "New Caledonia", phoneCode: "+687" },
  { code: "NE", name: "Niger", phoneCode: "+227" },
  { code: "NF", name: "Norfolk Island", phoneCode: "+672" },
  { code: "NG", name: "Nigeria", phoneCode: "+234" },
  { code: "NI", name: "Nicaragua", phoneCode: "+505" },
  { code: "NL", name: "Netherlands", phoneCode: "+31" },
  { code: "NO", name: "Norway", phoneCode: "+47" },
  { code: "NP", name: "Nepal", phoneCode: "+977" },
  { code: "NR", name: "Nauru", phoneCode: "+674" },
  { code: "NU", name: "Niue", phoneCode: "+683" },
  { code: "NZ", name: "New Zealand", phoneCode: "+64" },
  { code: "OM", name: "Oman", phoneCode: "+968" },
  { code: "PA", name: "Panama", phoneCode: "+507" },
  { code: "PE", name: "Peru", phoneCode: "+51" },
  { code: "PF", name: "French Polynesia", phoneCode: "+689" },
  { code: "PG", name: "Papua New Guinea", phoneCode: "+675" },
  { code: "PH", name: "Philippines", phoneCode: "+63" },
  { code: "PK", name: "Pakistan", phoneCode: "+92" },
  { code: "PL", name: "Poland", phoneCode: "+48" },
  { code: "PM", name: "Saint Pierre and Miquelon", phoneCode: "+508" },
  { code: "PN", name: "Pitcairn", phoneCode: "+64" },
  { code: "PR", name: "Puerto Rico", phoneCode: "+1" },
  { code: "PS", name: "Palestine", phoneCode: "+970" },
  { code: "PT", name: "Portugal", phoneCode: "+351" },
  { code: "PW", name: "Palau", phoneCode: "+680" },
  { code: "PY", name: "Paraguay", phoneCode: "+595" },
  { code: "QA", name: "Qatar", phoneCode: "+974" },
  { code: "RE", name: "Réunion", phoneCode: "+262" },
  { code: "RO", name: "Romania", phoneCode: "+40" },
  { code: "RS", name: "Serbia", phoneCode: "+381" },
  { code: "RU", name: "Russia", phoneCode: "+7" },
  { code: "RW", name: "Rwanda", phoneCode: "+250" },
  { code: "SA", name: "Saudi Arabia", phoneCode: "+966" },
  { code: "SB", name: "Solomon Islands", phoneCode: "+677" },
  { code: "SC", name: "Seychelles", phoneCode: "+248" },
  { code: "SD", name: "Sudan", phoneCode: "+249" },
  { code: "SE", name: "Sweden", phoneCode: "+46" },
  { code: "SG", name: "Singapore", phoneCode: "+65" },
  { code: "SH", name: "Saint Helena, Ascension and Tristan da Cunha", phoneCode: "+290" },
  { code: "SI", name: "Slovenia", phoneCode: "+386" },
  { code: "SJ", name: "Svalbard and Jan Mayen", phoneCode: "+47" },
  { code: "SK", name: "Slovakia", phoneCode: "+421" },
  { code: "SL", name: "Sierra Leone", phoneCode: "+232" },
  { code: "SM", name: "San Marino", phoneCode: "+378" },
  { code: "SN", name: "Senegal", phoneCode: "+221" },
  { code: "SO", name: "Somalia", phoneCode: "+252" },
  { code: "SR", name: "Suriname", phoneCode: "+597" },
  { code: "SS", name: "South Sudan", phoneCode: "+211" },
  { code: "ST", name: "Sao Tome and Principe", phoneCode: "+239" },
  { code: "SV", name: "El Salvador", phoneCode: "+503" },
  { code: "SX", name: "Sint Maarten (Dutch part)", phoneCode: "+1721" },
  { code: "SY", name: "Syria", phoneCode: "+963" },
  { code: "SZ", name: "Eswatini", phoneCode: "+268" },
  { code: "TC", name: "Turks and Caicos Islands", phoneCode: "+1649" },
  { code: "TD", name: "Chad", phoneCode: "+235" },
  { code: "TF", name: "French Southern Territories", phoneCode: "+262" },
  { code: "TG", name: "Togo", phoneCode: "+228" },
  { code: "TH", name: "Thailand", phoneCode: "+66" },
  { code: "TJ", name: "Tajikistan", phoneCode: "+992" },
  { code: "TK", name: "Tokelau", phoneCode: "+690" },
  { code: "TL", name: "Timor-Leste", phoneCode: "+670" },
  { code: "TM", name: "Turkmenistan", phoneCode: "+993" },
  { code: "TN", name: "Tunisia", phoneCode: "+216" },
  { code: "TO", name: "Tonga", phoneCode: "+676" },
  { code: "TR", name: "Türkiye", phoneCode: "+90" },
  { code: "TT", name: "Trinidad and Tobago", phoneCode: "+1868" },
  { code: "TV", name: "Tuvalu", phoneCode: "+688" },
  { code: "TW", name: "Taiwan", phoneCode: "+886" },
  { code: "TZ", name: "Tanzania", phoneCode: "+255" },
  { code: "UA", name: "Ukraine", phoneCode: "+380" },
  { code: "UG", name: "Uganda", phoneCode: "+256" },
  { code: "UM", name: "United States Minor Outlying Islands", phoneCode: "+1" },
  { code: "US", name: "United States", phoneCode: "+1" },
  { code: "UY", name: "Uruguay", phoneCode: "+598" },
  { code: "UZ", name: "Uzbekistan", phoneCode: "+998" },
  { code: "VA", name: "Holy See (Vatican City)", phoneCode: "+379" },
  { code: "VC", name: "Saint Vincent and the Grenadines", phoneCode: "+1784" },
  { code: "VE", name: "Venezuela", phoneCode: "+58" },
  { code: "VG", name: "Virgin Islands (British)", phoneCode: "+1284" },
  { code: "VI", name: "Virgin Islands (U.S.)", phoneCode: "+1340" },
  { code: "VN", name: "Vietnam", phoneCode: "+84" },
  { code: "VU", name: "Vanuatu", phoneCode: "+678" },
  { code: "WF", name: "Wallis and Futuna", phoneCode: "+681" },
  { code: "WS", name: "Samoa", phoneCode: "+685" },
  { code: "YE", name: "Yemen", phoneCode: "+967" },
  { code: "YT", name: "Mayotte", phoneCode: "+262" },
  { code: "ZA", name: "South Africa", phoneCode: "+27" },
  { code: "ZM", name: "Zambia", phoneCode: "+260" },
  { code: "ZW", name: "Zimbabwe", phoneCode: "+263" },
];

const blockedSet = new Set(BLOCKED_COUNTRY_CODES);

/**
 * Filtered list of allowed countries with blocked countries/regions removed
 */
export const ALLOWED_COUNTRIES: readonly Country[] = ALL_COUNTRIES.filter(
  (country) => !blockedSet.has(country.code)
);

/**
 * Check if an ISO 3166-1 alpha-2 country code is blocked
 */
export function isCountryBlocked(code: string): boolean {
  if (!code) return false;
  return blockedSet.has(code.trim().toUpperCase());
}

/**
 * Check if a US state code is blocked (NY, AK)
 */
export function isUsStateBlocked(stateCode: string): boolean {
  if (!stateCode) return false;
  return BLOCKED_US_STATES.includes(stateCode.trim().toUpperCase());
}

/**
 * Check if a Ukraine region is blocked (Crimea, Donetsk, Luhansk)
 */
export function isUkraineRegionBlocked(regionName: string): boolean {
  if (!regionName) return false;
  const normalized = regionName.trim().toLowerCase();
  return BLOCKED_UKRAINE_REGIONS.some(
    (blocked) => blocked.toLowerCase() === normalized
  );
}

/**
 * Helper to get country name by ISO 3166-1 alpha-2 code
 */
export function getCountryName(code: string): string {
  const upper = (code || "").trim().toUpperCase();
  const country = ALL_COUNTRIES.find((c) => c.code === upper);
  return country ? country.name : code;
}

/**
 * Helper to get Country object by ISO 3166-1 alpha-2 code
 */
export function getCountryByCode(code: string): Country | undefined {
  const upper = (code || "").trim().toUpperCase();
  return ALL_COUNTRIES.find((c) => c.code === upper);
}

/**
 * Helper to get country phone code by ISO 3166-1 alpha-2 code or country name
 */
export function getPhoneCode(codeOrName: string): string {
  if (!codeOrName) return "";
  const trimmed = codeOrName.trim().toUpperCase();
  const country = ALL_COUNTRIES.find(
    (c) => c.code === trimmed || c.name.toUpperCase() === trimmed
  );
  return country?.phoneCode || "";
}

