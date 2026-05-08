# Isha GPRS Automated Tests

Browser-based end-to-end tests for PRS registration flows using [Playwright](https://playwright.dev).

## What this covers

| Area | Tests |
|---|---|
| **Step 1 — Form validations** | Email format, phone digits, age boundary (18), WhatsApp field toggle |
| **Step 1 → Step 2 — Submission** | Complete form reaches payment summary |
| **E2E by country** | Switzerland, Germany, India, UK, France, USA |
| **E2E by gender** | Male, Female, Other |
| **E2E WhatsApp** | Same as phone / different number |
| **E2E promo code** | Apply discount code and complete payment |
| **E2E edge cases** | Boundary age 18, dietary restrictions, payment failure & retry |

21 tests total — 6 lightweight validation tests + 15 full E2E flows.

## Architecture

```text
tests/
├── helpers/
│   └── test-data.ts            # TestData type, country profiles, factory
├── pages/
│   ├── step1-form.page.ts      # Page Object: registration form (step 1)
│   └── step2-payment.page.ts   # Page Object: payment summary (step 2)
├── step1-form.spec.ts          # Step 1 field validations (no payment)
└── registration.spec.ts        # E2E flows: country × gender × options
```

### Page Object Models

The form is a **two-step wizard**. Each step has its own Page Object:

- **`Step1FormPage`** — personal details, address, dietary question, T&Cs, submit. Exposes individual field methods (`fillFirstName`, `selectCountry`, etc.) and a `fillAll(data)` convenience method.
- **`Step2PaymentPage`** — payment summary, promo code, Stripe payment iframe, success confirmation.

### Test data

`makeTestData()` generates a randomised user on every call:

- Random first/last name and email via [Faker](https://fakerjs.dev)
- Random country profile (phone, postal code, state, city)
- Random gender, age, WhatsApp preference, dietary flag
- Override any field: `makeTestData({ country: 'India', age: '18' })`

Pin to a specific country: `makeTestDataForCountry('germany')`.

**Available country profiles:** `switzerland`, `germany`, `india`, `uk`, `france`, `usa`

## Setup

```bash
git clone https://github.com/w0rldart/isha-gprs-automated-tests.git
cd isha-gprs-automated-tests
npm install
npx playwright install
```

## Environment variables

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|---|---|
| `TARGET_BASE_URL` | Base URL of the PRS environment |
| `TARGET_ADULT_REGISTRATION_FLOW_PATH` | Path to the adult registration form |
| `TARGET_MINOR_REGISTRATION_FLOW_PATH` | Path to the minor registration form |
| `TEST_PROMO_CODE` | *(optional)* Discount code — falls back to built-in default |

> [!NOTE]
> User data (name, email, phone, address) is generated automatically by Faker. The `TEST_USER_*` env vars from `.env.example` are kept for reference but are **not required** — the test suite generates its own data each run.

## Running tests

```bash
# Full suite (headless)
npm test

# Visible browser
npm run test:headed

# Interactive UI mode
npm run test:ui

# Debug mode (step through)
npm run test:debug

# Open last HTML report
npm run report
```

### Run a specific group

```bash
# Only step 1 validations
npx playwright test step1-form

# Only E2E registration flows
npx playwright test registration

# Only a specific country
npx playwright test -g "switzerland"
```

## Codegen

Use Playwright codegen to inspect the live form and discover selectors:

```bash
npm run codegen:adult
npm run codegen:minor
```

Use the output to inform locator updates in the Page Objects — don't paste raw codegen output as final test code.

## Selector strategy

| Field type | Approach |
|---|---|
| Text inputs | `page.getByLabel()` matching the `<label>` text |
| Buttons | `page.getByRole('button', { name: ... })` |
| Radio groups | Scoped to `div[role="group"]` by question text |
| React-Select dropdowns | Click combobox → type → click filtered option |
| Phone (react-tel-input) | `.react-tel-input input.form-control[type="tel"]` |
| Checkboxes | `#tnc_gdpr_consent`, `#tnc_refund` by ID |
| Stripe payment | `page.frameLocator('iframe')` for secure input frame |

Avoid Chakra-generated CSS class names — they're not stable across builds.

## CI

The repository includes a GitHub Actions workflow in `.github/workflows/playwright.yml`.

- Local config: `.env` (never committed)
- CI config: GitHub Secrets
- Artifacts: HTML report, screenshots, traces, and videos on failure

## Current limitations

Not implemented yet:

- Email inbox verification
- Epass verification
- Minor registration automation
- Optional SSO resume flow
- Deeper resilience around payment-provider UI changes

## Troubleshooting

| Problem | Fix |
|---|---|
| Missing required env variable | Ensure `.env` exists with `TARGET_BASE_URL` and `TARGET_ADULT_REGISTRATION_FLOW_PATH` |
| Selectors no longer match | Run `npm run codegen:adult` to discover updated locators, then update the Page Objects |
| Payment fields not found | Stripe renders secure fields inside iframes — the test uses `frameLocator()` to reach them |
| CI fails but local works | Download the Playwright report artifact from the GitHub Actions run |

## Public repo safety

> [!CAUTION]
> This repository is public. Never commit `.env`, real user data, credentials, or session artifacts. Use GitHub Secrets for CI. Enable secret scanning and push protection.
