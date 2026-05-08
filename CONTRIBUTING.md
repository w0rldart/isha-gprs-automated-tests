# Contributing

Thanks for helping improve the PRS automated tests! Please follow these guidelines to keep things clean and consistent.

## Golden rules

1. **Never commit secrets.** No `.env` files, real URLs, credentials, personal data, or session artifacts. Ever.
2. **Tests must pass before pushing.** Run `npm test` locally and fix any failures.
3. **One change per pull request.** Don't bundle unrelated fixes together.

## Branch naming

Use a descriptive branch name with a prefix:

```
feat/add-minor-registration-flow
fix/phone-country-selector
chore/update-playwright
```

| Prefix   | When to use                                       |
| -------- | ------------------------------------------------- |
| `feat/`  | New test, new country profile, new form coverage  |
| `fix/`   | Fixing a broken test or selector                  |
| `chore/` | Dependency updates, config changes, documentation |

**Never push directly to `master`.** Always create a branch and open a pull request.

## Before you start

```bash
# Make sure you're on the latest master
git checkout master
git pull

# Create your branch
git checkout -b feat/your-change

# Install dependencies (in case they changed)
npm install
```

## Writing tests

### Follow the existing structure

```
tests/
├── helpers/test-data.ts           ← Test data only
├── pages/step1-form.page.ts       ← Step 1 form interactions only
├── pages/step2-payment.page.ts    ← Step 2 payment interactions only
├── step1-form.spec.ts             ← Step 1 validation tests
└── registration.spec.ts           ← Full E2E registration tests
```

- **New form interactions** → add methods to the relevant Page Object in `pages/`
- **New test data / country profiles** → add to `helpers/test-data.ts`
- **New validation test** → add to `step1-form.spec.ts`
- **New E2E flow** → add to `registration.spec.ts`

**Don't** create random helper files or put page logic inside spec files.

### Page Object rules

- Each public method should do **one thing** (e.g., `fillEmail`, `selectCountry`)
- Keep selectors inside the Page Object — never put raw selectors in spec files
- Use Playwright's built-in locators (`getByLabel`, `getByRole`, `getByText`) over CSS selectors where possible
- Avoid Chakra-generated CSS class names — they change between builds

### Test data rules

- All user data (name, email, phone, address) must come from `makeTestData()` — never hardcode real people's details
- Country profiles must use **real values** that the form actually accepts (correct state names from the dropdown, valid postal codes, etc.)
- When adding a new country, check the actual dropdown options in the form first

### Writing good tests

```typescript
// ✅ Good: clear, focused, one assertion per behavior
test("rejects age below 18 on adult form", async ({ page }) => {
  const form = new Step1FormPage(page);
  await form.goto(flowPath);
  await form.fillAge("17");
  await page.getByRole("spinbutton", { name: /age/i }).blur();
  await expect(page.locator("body")).toContainText(/18|adult|age/i);
});

// ❌ Bad: vague name, tests multiple things, hardcoded data
test("form test", async ({ page }) => {
  // ...fills everything, checks everything, 50 lines long
});
```

## Commit messages

Write clear, descriptive commit messages:

```
✅  fix: update Germany state to "Bayern" to match dropdown values
✅  feat: add dietary restrictions follow-up fields
✅  chore: upgrade Playwright to 1.60

❌  fixed stuff
❌  updates
❌  WIP
```

## Pull request checklist

Before opening a PR, make sure:

- [ ] `npm test` passes locally with **zero failures**
- [ ] No `.env` values, real URLs, or personal data in the code
- [ ] Branch is up to date with `master` (`git merge master` or `git rebase master`)
- [ ] Commit messages are descriptive
- [ ] PR description explains **what** you changed and **why**
- [ ] If you added a new country/field: you verified the values against the real form

## Running tests locally

```bash
# Full suite
npm test

# Watch what the bot does (visible browser)
npm run test:headed

# Run only the tests you changed
npx playwright test -g "your test name"

# Debug a specific test step by step
npm run test:debug
```

## When tests break

The PRS form may change without notice. When tests break:

1. **Don't panic** — it's usually a selector or dropdown value that changed
2. Use `npm run codegen:adult` to inspect the current form in a live browser
3. Update the Page Object (`step1-form.page.ts` or `step2-payment.page.ts`) with the new selectors
4. Run the failing test in headed mode to verify: `npx playwright test --headed -g "test name"`
5. Commit and PR the fix

## Need help?

- Check the [README](./README.md) for setup and usage
- Check the [Playwright docs](https://playwright.dev/docs/intro) for general Playwright questions
- Open a GitHub Issue if something is unclear
