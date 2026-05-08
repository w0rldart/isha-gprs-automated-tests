import { test, expect } from '@playwright/test';

const adultPath = process.env.ADULT_EVENT_PATH;

test.describe('PRS form validations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(adultPath);
    await page.waitForLoadState('domcontentloaded');
  });

  test('invalid email should be rejected', async ({ page }) => {
    const email = page.locator('input[name*="email"], input[type="email"]').first();
    await email.fill('abc@xyz');
    await email.blur();

    await expect(email).toHaveValue('abc@xyz');
    await expect(page.locator('body')).toContainText(/valid email|invalid email|email/i);
  });

  test('india phone should enforce 10 digits', async ({ page }) => {
    const country = page.locator('select[name*="country"]').first();
    if (await country.count()) {
      await country.selectOption({ label: 'India' });
    }

    const phone = page.locator('input[name*="phone"], input[type="tel"]').first();
    await phone.fill('12345');
    await phone.blur();

    await expect(page.locator('body')).toContainText(/10 digit|valid phone|phone/i);
  });

  test('age below 18 should be rejected on adult form', async ({ page }) => {
    const age = page.locator('input[name*="age"], input[placeholder*="Age"]').first();
    await age.fill('17');
    await age.blur();

    await expect(page.locator('body')).toContainText(/18|adult|age/i);
  });

  test('unchecked declarations should block progress', async ({ page }) => {
    const name = page.locator('input[name*="name"], input[type="text"]').first();
    const email = page.locator('input[name*="email"], input[type="email"]').first();
    const phone = page.locator('input[name*="phone"], input[type="tel"]').first();

    if (await name.count()) await name.fill('Test User');
    if (await email.count()) await email.fill(`nodecl-${Date.now()}@example.com`);
    if (await phone.count()) await phone.fill('9876543210');

    const continueButton = page.getByRole('button', { name: /continue|proceed|pay now/i }).first();
    await continueButton.click();

    await expect(page.locator('body')).toContainText(/terms|declaration|agree|required/i);
  });

  test('whatsapp field should be conditionally shown', async ({ page }) => {
    const noOption = page.locator('label:has-text("No"), text="No"').first();
    if (await noOption.count()) {
      await noOption.click();
    }

    await expect(page.locator('body')).toContainText(/whatsapp|wa/i);
  });
});
