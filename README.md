# Isha GPRS Automated Tests

Browser-based end-to-end automated tests for the Isha Global PRS registration flows using Playwright.

This repository is meant to give a practical starting point for automating the UAT registration scenarios described in the Global PRS test scenarios document, especially the adult registration success flow, discount coupon flow, payment failure and retry flow, and key form validations.

## What this project covers

The initial test scope focuses on the easiest and most repeatable browser flows from the supplied test scenarios:

- Adult participant registration success flow.
- Discount coupon flow (<ASK FOR A CODE>) for a 10% discount on the base price.
- Payment failure and retry flow.
- Core form validations such as email, phone, age, declarations, and WhatsApp field behavior.

The project uses Playwright because it supports browser automation, code generation through `playwright codegen`, Playwright UI mode, and standard test configuration for screenshots, traces, retries, and reports.

## Repository structure

```text
.
├── .github/
│   └── workflows/
│       └── playwright.yml
├── tests/
│   ├── registration.spec.ts
│   └── validations.spec.ts
├── .env.example
├── .gitignore
├── package.json
├── playwright.config.ts
├── README.md
└── tsconfig.json
```

## Prerequisites

Before running the tests, make sure the following are available:

- Node.js 20+ recommended.
- npm available in the shell.
- Access to the UAT PRS environment.
- A valid internet connection so Playwright can install browsers and open the Stripe-hosted payment page when needed.

## Local setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/w0rldart/isha-gprs-automated-tests.git
cd isha-gprs-automated-tests
npm install
npx playwright install
```

Playwright recommends installing the package dependencies first and then installing the browser binaries before running tests.

## Environment configuration

Copy the sample environment file:

```bash
cp .env.example .env
```

Populate **every** variable in `.env`. This project has no committed defaults by design.

### Required environment variables

```bash
TARGET_BASE_URL=<TO_BE_OBTAINED>
TARGET_ADULT_REGISTRATION_FLOW_PATH=<TO_BE_OBTAINED>
TARGET_MINOR_REGISTRATION_FLOW_PATH=<TO_BE_OBTAINED>

TEST_USER_NAME=John Smith
TEST_USER_EMAIL=john@smith.com
TEST_USER_PHONE=9876543210
TEST_USER_WA_PHONE=9876543211
TEST_USER_AGE=28
TEST_USER_COUNTRY=India
TEST_USER_POSTAL_CODE=560001

TEST_PROMO_CODE=<TO_BE_OBTAINED>

TEST_PAYMENT_CARD_NUMBER=4242424242424242
TEST_PAYMENT_EXPIRY=12/30
TEST_PAYMENT_CVC=123
```

### Variable purpose

| Variable | Purpose |
|---|---|
| `TARGET_BASE_URL` | Base URL for the authorized target environment. |
| `TARGET_ADULT_REGISTRATION_FLOW_PATH` | Main registration flow testing procedure. |
| `TARGET_MINOR_REGISTRATION_FLOW_PATH` | Important validations (i.e.: minors check). |
| `TEST_USER_NAME` | Display or form name value for the test user. |
| `TEST_USER_EMAIL` | Email value used during form submission. |
| `TEST_USER_PHONE` | Primary phone number for the test user. |
| `TEST_USER_WA_PHONE` | WhatsaApp phone number. |
| `TEST_USER_AGE` | Age value for minimum-age validation and happy-path coverage. |
| `TEST_USER_COUNTRY` | Country selection label or value. |
| `TEST_USER_POSTAL_CODE` | Postal code or pincode used by the form. |
| `TEST_PROMO_CODE` | Promotional or discount code, if applicable to the target flow. |
| `TEST_PAYMENT_CARD_NUMBER` | Payment card value for the authorized test environment. |
| `TEST_PAYMENT_EXPIRY` | Payment expiry value for the authorized test environment. |
| `TEST_PAYMENT_CVC` | Payment CVC value for the authorized test environment. |

## Running the tests

Run the full suite:

```bash
npm test
```

Run with a visible browser:

```bash
npm run test:headed
```

Run in Playwright UI mode:

```bash
npm run test:ui
```

Run in debug mode:

```bash
npm run test:debug
```

Playwright supports headed runs, a visual UI mode, and debugging workflows directly through the Playwright test runner.

## Generating tests from the browser

To record flows directly from browser interactions:

```bash
npm run codegen:adult
npm run codegen:minor
```

These scripts use `playwright codegen`, which opens a real browser window and generates Playwright test steps from user interactions.

A practical workflow is:

1. Run `npm run codegen:adult`.
2. Complete the PRS form manually in the opened browser.
3. Copy the generated locators and actions.
4. Replace any broad fallback selectors in `tests/registration.spec.ts` with the generated ones.
5. Re-run the test with `npm run test:headed`.

## Current test scope

### `tests/registration.spec.ts`

This file contains the main end-to-end flows:

- Adult registration success flow.
- Discount coupon application and discounted payment flow.
- Payment failure followed by retry and success.

### `tests/validations.spec.ts`

This file contains key validation and conditional-rendering checks:

- Invalid email format should be rejected.
- India phone number should enforce the expected 10-digit behavior.
- Age below 18 should be rejected in the adult registration flow.
- Declarations must be agreed before proceeding.
- WhatsApp field behavior should change based on whether WhatsApp is the same as phone.

## Recommended execution order

For the fastest stabilization, use this order:

1. Adult registration success.
2. Discount coupon flow.
3. Payment failure and retry.
4. Validation tests.
5. Minor registration.
6. Optional SSO resume flow.

This order mirrors the simplest-to-most-complex path based on the scenario document, where SSO resume and minor registration involve more state handling and input complexity.

## Reports, traces, screenshots, and video

The Playwright config is set up to produce:

- HTML reports.
- Screenshots on failure.
- Traces on first retry.
- Video on first retry.

Open the HTML report after a run:

```bash
npm run report
```

These artifacts are especially useful when a UAT flow changes and a selector or payment step starts failing unexpectedly.

## GitHub Actions

The repository includes a GitHub Actions workflow at `.github/workflows/playwright.yml` so tests can run on pushes, pull requests, and manual workflow dispatches.

Typical CI flow:

- Check out the repository.
- Install Node dependencies.
- Install Playwright browsers.
- Run the test suite.
- Upload the Playwright HTML report as an artifact.

## Working with selectors

The provided tests intentionally use broad fallback selectors because the exact DOM structure of the live UAT pages may evolve. In practice, the most reliable way to stabilize the suite is to replace generic selectors with Playwright-generated role, label, and text locators captured from the actual running page.

Recommended locator strategy:

- Prefer `getByRole()` for buttons, links, and dialogs.
- Prefer `getByLabel()` for form fields where labels are correctly associated.
- Use `getByText()` sparingly for stable visible text.
- Avoid brittle CSS chains unless the app provides no semantic hooks.

## Known limitations

This starter suite is intentionally practical rather than exhaustive.

Current limitations include:

- Email inbox verification is not implemented yet, even though the scenario document expects confirmation email verification in some flows.
- Epass validation is not implemented yet.
- Minor registration is not included in the first-pass suite yet.
- Optional SSO resume flow is not included in the first-pass suite yet.
- The Stripe interaction may need adjustment depending on whether the payment page is embedded or redirected in the current UAT build.

## Suggested next improvements

After the first successful run, the best next enhancements are:

- Refactor into Page Object Model classes for maintainability.
- Add seeded test data helpers.
- Add a dedicated `minor-registration.spec.ts` file.
- Add an `sso-resume.spec.ts` file.
- Add inbox verification using a test mailbox API if email validation becomes required.
- Add tags such as `@smoke`, `@regression`, and `@payment` for targeted runs.

## Useful commands

```bash
npm install
npx playwright install
npm test
npm run test:headed
npm run test:ui
npm run test:debug
npm run codegen:adult
npm run codegen:minor
npm run report
```

## Publishing notes

Because this is a public repository, avoid committing secrets or real personal data. Only keep sample test values in `.env.example`, and keep real local overrides in `.env`, which should stay gitignored.

A good practice for public repos is:

- Commit only sample environment values.
- Never commit real user emails or phone numbers.
- Never commit session tokens or credentials.
- Use GitHub repository secrets later if sensitive CI values are needed.

## Troubleshooting

### Tests fail on first run

This usually means the generated selectors do not match the current UAT DOM exactly. Re-record the target flow with `npm run codegen:adult` and replace the unstable locators with generated ones.

### Payment fields are not found

Stripe fields are often rendered inside iframes, so the test must target the payment iframe rather than the main page DOM. Playwright supports frame locators for this use case.

### Browser does not open

Use headed mode or UI mode:

```bash
npm run test:headed
npm run test:ui
```

### CI passes locally but fails on GitHub

This often happens when timing is tighter in CI. Add explicit waits only where needed, prefer robust assertions, and inspect the uploaded report, screenshots, and trace artifacts from the workflow run.

## Source basis

The current automation scope is based on the supplied Global PRS scenario document, which defines the event links, validation expectations, coupon code, and Stripe test card values for the target flows.
