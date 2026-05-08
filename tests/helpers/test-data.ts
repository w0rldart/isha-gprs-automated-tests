import { faker } from "@faker-js/faker";

// ── Types ─────────────────────────────────────────────────────

export type TestData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  waPhone: string;
  age: string;
  gender: string;
  country: string;
  postalCode: string;
  state: string;
  city: string;
  address: string;
  promoCode: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
  whatsappSameAsPhone: boolean;
  dietaryRestrictions: boolean;
  dietaryDetails: string;
  allergySeverity: string;
};

// ── Country profiles ──────────────────────────────────────────

export type CountryProfile = Pick<
  TestData,
  "country" | "postalCode" | "state" | "city" | "phone" | "waPhone"
>;

export const countries: Record<string, CountryProfile> = {
  switzerland: {
    country: "Switzerland",
    postalCode: "8000",
    state: "Zurich",
    city: "Zurich",
    phone: "791234567",
    waPhone: "791234568",
  },
  germany: {
    country: "Germany",
    postalCode: "80331",
    state: "Bayern",
    city: "Munich",
    phone: "1712345678",
    waPhone: "1712345679",
  },
  india: {
    country: "India",
    postalCode: "560001",
    state: "Karnataka",
    city: "Bengaluru",
    phone: "9876543210",
    waPhone: "9876543211",
  },
  uk: {
    country: "United Kingdom",
    postalCode: "SW1A 1AA",
    state: "London",
    city: "London",
    phone: "7911123456",
    waPhone: "7911123457",
  },
  france: {
    country: "France",
    postalCode: "75001",
    state: "Île-de-France",
    city: "Paris",
    phone: "612345678",
    waPhone: "612345679",
  },
};

// ── Parameter pools for randomisation ─────────────────────────

export const genders = ["Male", "Female", "Other"] as const;
export const ages = ["18", "25", "31", "45", "60"] as const;
export const allergySeverities = [
  "No food allergies",
  "Not too bad - Can handle the allergic reaction without medication",
  "Mild but need medication",
  "Severe - requires treatment with high doses of medication",
  "Life Threatening (Bring medication and inform doctor at venue)",
] as const;

// ── Helpers ───────────────────────────────────────────────────

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickCountry(): CountryProfile {
  const keys = Object.keys(countries);
  return countries[keys[Math.floor(Math.random() * keys.length)]];
}

// ── Factory ───────────────────────────────────────────────────

/**
 * Build a full TestData object. Sensible defaults with random name/email,
 * country profile, gender, and age. Override any field explicitly.
 */
export function makeTestData(overrides: Partial<TestData> = {}): TestData {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const country = pickCountry();

  return {
    firstName,
    lastName,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    gender: pick(genders),
    age: pick(ages),
    address: faker.location.streetAddress(),
    whatsappSameAsPhone: pick([true, false]),
    dietaryRestrictions: pick([true, false]),
    dietaryDetails: "Gluten-free diet required",
    allergySeverity: pick(allergySeverities),
    promoCode: process.env.TEST_PROMO_CODE || "IET10m2yz",
    cardNumber: "4242424242424242",
    expiry: "12/30",
    cvc: "123",
    // Spread country profile, then user overrides (overrides win)
    ...country,
    ...overrides,
  };
}

/**
 * Build TestData pinned to a specific country profile.
 */
export function makeTestDataForCountry(
  countryKey: keyof typeof countries,
  overrides: Partial<TestData> = {},
): TestData {
  return makeTestData({ ...countries[countryKey], ...overrides });
}
