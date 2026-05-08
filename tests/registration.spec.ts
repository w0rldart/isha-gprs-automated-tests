import { test, expect } from '@playwright/test';
import { Step1FormPage } from './pages/step1-form.page';
import { Step2PaymentPage } from './pages/step2-payment.page';
import { makeTestData, makeTestDataForCountry, countries, genders } from './helpers/test-data';

const flowPath = process.env.TARGET_ADULT_REGISTRATION_FLOW_PATH!;

// ── Per-country E2E flows ─────────────────────────────────────

test.describe('E2E Registration — by country', () => {
  for (const countryKey of Object.keys(countries)) {
    test(`happy path — ${countryKey}`, async ({ page }) => {
      const data = makeTestDataForCountry(countryKey as keyof typeof countries);
      const step1 = new Step1FormPage(page);
      const step2 = new Step2PaymentPage(page);

      await step1.goto(flowPath);
      await step1.fillAll(data);
      await step1.submit();

      await step2.expectVisible();
      await step2.pay();
      await step2.completeStripePayment(data);
      await step2.expectSuccess();
    });
  }
});

// ── Per-gender E2E flows ──────────────────────────────────────

test.describe('E2E Registration — by gender', () => {
  for (const gender of genders) {
    test(`happy path — ${gender.toLowerCase()}`, async ({ page }) => {
      const data = makeTestData({ gender });
      const step1 = new Step1FormPage(page);
      const step2 = new Step2PaymentPage(page);

      await step1.goto(flowPath);
      await step1.fillAll(data);
      await step1.submit();

      await step2.expectVisible();
      await step2.pay();
      await step2.completeStripePayment(data);
      await step2.expectSuccess();
    });
  }
});

// ── WhatsApp variations ───────────────────────────────────────

test.describe('E2E Registration — WhatsApp', () => {
  test('whatsapp same as phone', async ({ page }) => {
    const data = makeTestData({ whatsappSameAsPhone: true });
    const step1 = new Step1FormPage(page);
    const step2 = new Step2PaymentPage(page);

    await step1.goto(flowPath);
    await step1.fillAll(data);
    await step1.submit();

    await step2.expectVisible();
    await step2.pay();
    await step2.completeStripePayment(data);
    await step2.expectSuccess();
  });

  test('whatsapp different from phone', async ({ page }) => {
    const data = makeTestData({ whatsappSameAsPhone: false });
    const step1 = new Step1FormPage(page);
    const step2 = new Step2PaymentPage(page);

    await step1.goto(flowPath);
    await step1.fillAll(data);
    await step1.submit();

    await step2.expectVisible();
    await step2.pay();
    await step2.completeStripePayment(data);
    await step2.expectSuccess();
  });
});

// ── Promo code ────────────────────────────────────────────────

test.describe('E2E Registration — promo code', () => {
  test('applies promo code and completes payment', async ({ page }) => {
    const data = makeTestData();
    const step1 = new Step1FormPage(page);
    const step2 = new Step2PaymentPage(page);

    await step1.goto(flowPath);
    await step1.fillAll(data);
    await step1.submit();

    await step2.expectVisible();
    await step2.applyPromoCode(data.promoCode);
    await step2.pay();
    await step2.completeStripePayment(data);
    await step2.expectSuccess();
  });
});

// ── Edge cases ────────────────────────────────────────────────

test.describe('E2E Registration — edge cases', () => {
  test('boundary age 18', async ({ page }) => {
    const data = makeTestData({ age: '18' });
    const step1 = new Step1FormPage(page);
    const step2 = new Step2PaymentPage(page);

    await step1.goto(flowPath);
    await step1.fillAll(data);
    await step1.submit();

    await step2.expectVisible();
    await step2.pay();
    await step2.completeStripePayment(data);
    await step2.expectSuccess();
  });

  test('with dietary restrictions', async ({ page }) => {
    const data = makeTestData({ dietaryRestrictions: true });
    const step1 = new Step1FormPage(page);
    const step2 = new Step2PaymentPage(page);

    await step1.goto(flowPath);
    await step1.fillAll(data);
    await step1.submit();

    await step2.expectVisible();
    await step2.pay();
    await step2.completeStripePayment(data);
    await step2.expectSuccess();
  });

  test('payment failure and retry', async ({ page }) => {
    const data = makeTestData();
    const step1 = new Step1FormPage(page);
    const step2 = new Step2PaymentPage(page);

    await step1.goto(flowPath);
    await step1.fillAll(data);
    await step1.submit();

    await step2.expectVisible();
    await step2.pay();

    // Simulate failure by going back
    await page.goBack();
    await page.getByRole('button', { name: /retry payment|retry|pay now/i }).first().click();

    await step2.completeStripePayment(data);
    await step2.expectSuccess();
  });
});
