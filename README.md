# Isha GPRS — Automated Registration Tests

Automated browser tests that simulate a real person registering for an Isha program through the PRS (Participant Registration System) form. The tests open a browser, fill in every field, submit the form, and complete payment — just like a participant would.

Built with [Playwright](https://playwright.dev) (browser automation) and [Faker](https://fakerjs.dev) (realistic fake data).

## What does this test?

The registration form is a **two-step process**:

1. **Step 1 — Registration form:** Fill in personal details (name, email, phone), address, dietary needs, and accept terms & conditions
2. **Step 2 — Payment:** Review the summary, optionally apply a promo code, and pay via Stripe

The test suite checks both steps:

### Form validation checks (Step 1 only — quick, no payment)

These tests check that the form catches mistakes before submission:

- Invalid email address is rejected
- Age below 18 is rejected on the adult form
- Phone number with too few digits is rejected
- WhatsApp number field appears/disappears based on the radio button selection

### Full registration flows (Step 1 → Step 2 → Payment)

These tests go through the entire process from start to finish:

| What's tested | Variations |
|---|---|
| **Different countries** | Switzerland, Germany, India, UK, France — each with matching phone prefix, postal code, state, and city |
| **Different genders** | Male, Female, Other |
| **WhatsApp number** | Same as phone number / different number |
| **Promo/discount code** | Enter a discount code and verify it's applied |
| **Minimum age** | User who is exactly 18 years old |
| **Dietary restrictions** | "Yes" selection with allergy details and severity |
| **Payment failure** | Simulates a failed payment and retries |

**Total: 21 tests** — 6 validation + 15 full end-to-end.

### Test data

Every test run generates **fresh, randomised data** — random names, email addresses, and street addresses. Each run also randomly picks a country, gender, age, and form options so the tests cover a wide variety of combinations over time.

## Getting started

### 1. Install

```bash
git clone https://github.com/w0rldart/isha-gprs-automated-tests.git
cd isha-gprs-automated-tests
npm install
npx playwright install
```

### 2. Configure

```bash
cp .env.example .env
```

Open `.env` and fill in:

| Variable | What it is | Example |
|---|---|---|
| `TARGET_BASE_URL` | The URL of the PRS environment to test against | `https://uat-prs-eu.sadhguru.org` |
| `TARGET_ADULT_REGISTRATION_FLOW_PATH` | The path to the adult registration form | `/event/some-registration-path` |
| `TARGET_MINOR_REGISTRATION_FLOW_PATH` | The path to the minor registration form | `/event/minor-registration-path` |
| `TEST_PROMO_CODE` | *(optional)* A discount code to test with | `IET10m2yz` |

> [!NOTE]
> You do **not** need to configure any user details (name, email, phone, etc). The tests generate realistic fake data automatically on every run.

### 3. Run

```bash
# Run all tests (browser runs in the background)
npm test

# Run with a visible browser (so you can watch what's happening)
npm run test:headed

# Run in interactive UI mode (pick & choose tests, see results live)
npm run test:ui

# Run in debug mode (pause at each step)
npm run test:debug
```

### 4. View results

After a test run, open the HTML report:

```bash
npm run report
```

This opens a detailed report in your browser showing which tests passed or failed, with screenshots and error messages for any failures.

## Running specific tests

You don't have to run everything. You can target specific groups:

```bash
# Only the quick form validation checks (no payment)
npx playwright test step1-form

# Only the full registration flows
npx playwright test registration

# Only tests for a specific country
npx playwright test -g "switzerland"
npx playwright test -g "india"

# Only the promo code test
npx playwright test -g "promo"
```

## Project structure

```text
tests/
├── helpers/
│   └── test-data.ts              ← Fake user data generation
├── pages/
│   ├── step1-form.page.ts        ← How to interact with the registration form
│   └── step2-payment.page.ts     ← How to interact with the payment page
├── step1-form.spec.ts            ← Form validation tests
└── registration.spec.ts          ← Full registration flow tests
```

- **`test-data.ts`** — Generates a fake participant with a random name, email, phone number, and address. Has built-in profiles for different countries (Switzerland, Germany, India, UK, France) with correct phone formats, postal codes, and states.
- **`step1-form.page.ts`** — Contains the logic for filling in the registration form: typing into text fields, selecting from dropdowns, picking radio buttons, choosing phone country codes, and accepting terms.
- **`step2-payment.page.ts`** — Contains the logic for the payment page: applying a promo code, filling in Stripe card details, and confirming success.
- **`step1-form.spec.ts`** — The actual validation tests (6 tests).
- **`registration.spec.ts`** — The actual end-to-end tests (15 tests).

## Codegen (for developers)

If the form changes and tests break, use Playwright's codegen tool to inspect the live form and find updated selectors:

```bash
npm run codegen:adult
npm run codegen:minor
```

This opens a browser where you can interact with the form while Playwright records the actions and shows you the selectors it would use.

## CI (GitHub Actions)

Tests can run automatically on every push via the GitHub Actions workflow in `.github/workflows/playwright.yml`.

- **Locally:** Test configuration lives in `.env` (never committed to git)
- **In CI:** Configuration is stored in GitHub Secrets
- **On failure:** The workflow saves screenshots, videos, and traces as downloadable artifacts

## Not implemented yet

- Email/inbox verification after registration
- Epass verification
- Minor (under 18) registration flow
- SSO login-based registration
- Testing against changes in Stripe's payment UI

## Troubleshooting

| What went wrong | What to do |
|---|---|
| "Missing required env var" | Make sure your `.env` file exists and has `TARGET_BASE_URL` and `TARGET_ADULT_REGISTRATION_FLOW_PATH` filled in |
| Tests used to pass but now fail | The form may have changed. Run `npm run codegen:adult` to inspect the current form and update the Page Object files |
| "Payment fields not found" | Stripe renders card inputs inside a secure iframe. If Stripe changed their frame structure, the `step2-payment.page.ts` file needs updating |
| Tests pass locally but fail in CI | Download the Playwright report artifact from the GitHub Actions run to see screenshots and error details |

## Security

> [!CAUTION]
> This repository is public.
>
> - **Never** commit `.env` or any file containing real URLs, credentials, or personal data
> - Use GitHub Secrets for CI configuration
> - Enable secret scanning and push protection on the repository
