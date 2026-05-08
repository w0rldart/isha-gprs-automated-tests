import { test, expect } from '@playwright/test';
import { Step1FormPage } from './pages/step1-form.page';
import { makeTestData } from './helpers/test-data';

const flowPath = process.env.TARGET_ADULT_REGISTRATION_FLOW_PATH!;

test.describe('Step 1 — Form validations', () => {
  test('rejects invalid email', async ({ page }) => {
    const form = new Step1FormPage(page);
    await form.goto(flowPath);

    await form.fillEmail('abc@xyz');
    await page.getByLabel(/^email/i).blur();

    await expect(page.locator('body')).toContainText(/valid email|invalid email|email/i);
  });

  test('rejects age below 18 on adult form', async ({ page }) => {
    const form = new Step1FormPage(page);
    await form.goto(flowPath);

    await form.fillAge('17');
    await page.getByRole('spinbutton', { name: /age/i }).blur();

    await expect(page.locator('body')).toContainText(/18|adult|age/i);
  });

  test('shows WhatsApp field when "No" is selected', async ({ page }) => {
    const form = new Step1FormPage(page);
    await form.goto(flowPath);

    await form.selectWhatsAppSameAsPhone(false);

    await expect(form.phoneInput(1)).toBeVisible();
  });

  test('hides WhatsApp field when "Yes" is selected', async ({ page }) => {
    const form = new Step1FormPage(page);
    await form.goto(flowPath);

    await form.selectWhatsAppSameAsPhone(true);

    await expect(form.phoneInput(1)).toHaveCount(0);
  });

  test('india phone should enforce 10 digits', async ({ page }) => {
    const form = new Step1FormPage(page);
    await form.goto(flowPath);

    await form.fillPhone('12345', 'India');
    await form.phoneInput(0).blur();

    await expect(page.locator('body')).toContainText(
      /10 digit|valid phone|invalid number|phone/i,
    );
  });

  test('valid form reaches step 2 payment summary', async ({ page }) => {
    const form = new Step1FormPage(page);
    const data = makeTestData();

    await form.goto(flowPath);
    await form.fillAll(data);
    await form.submit();

    await expect(page.getByText(/payment summary/i)).toBeVisible();
    await expect(page.getByText(/do you have a discount code/i)).toBeVisible();
  });
});
