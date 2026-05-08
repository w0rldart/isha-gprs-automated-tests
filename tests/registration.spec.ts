import { test, expect, Page, FrameLocator } from '@playwright/test';

const primaryFlowPath = process.env.TARGET_ADULT_REGISTRATION_FLOW_PATH;

if (!primaryFlowPath) {
  throw new Error('Missing required env var: TARGET_PRIMARY_FLOW_PATH');
}

const testData = {
  name: process.env.TEST_USER_NAME,
  email: process.env.TEST_USER_EMAIL,
  phone: process.env.TEST_USER_PHONE,
  waPhone: process.env.TEST_USER_WA_PHONE,
  age: process.env.TEST_USER_AGE,
  country: process.env.TEST_USER_COUNTRY,
  postalCode: process.env.TEST_USER_POSTAL_CODE,
  promoCode: process.env.TEST_PROMO_CODE,
  cardNumber: process.env.TEST_PAYMENT_CARD_NUMBER,
  expiry: process.env.TEST_PAYMENT_EXPIRY,
  cvc: process.env.TEST_PAYMENT_CVC,
};

async function fillIfVisible(page: Page, selectors: string[], value: string) {
  for (const selector of selectors) {
    const field = page.locator(selector).first();
    if (await field.count()) {
      try {
        await field.fill(value);
        return true;
      } catch {}
    }
  }
  return false;
}

async function clickIfVisible(page: Page, selectors: string[]) {
  for (const selector of selectors) {
    const el = page.locator(selector).first();
    if (await el.count()) {
      try {
        await el.click();
        return true;
      } catch {}
    }
  }
  return false;
}

async function selectIfVisible(page: Page, selectors: string[], value: string) {
  for (const selector of selectors) {
    const el = page.locator(selector).first();
    if (await el.count()) {
      try {
        await el.selectOption({ label: value });
        return true;
      } catch {
        try {
          await el.selectOption(value);
          return true;
        } catch {}
      }
    }
  }
  return false;
}

async function fillAdultRegistrationForm(page: Page) {
  await page.goto(primaryFlowPath);

  await page.waitForLoadState('domcontentloaded');

  await fillIfVisible(page, [
    'input[name*="name"]',
    'input[placeholder*="Name"]',
    'input[type="text"]'
  ], testData.name);

  await fillIfVisible(page, [
    'input[name*="email"]',
    'input[type="email"]'
  ], testData.email);

  await fillIfVisible(page, [
    'input[name*="phone"]',
    'input[type="tel"]'
  ], testData.phone);

  await selectIfVisible(page, [
    'select[name*="country"]'
  ], testData.country);

  await fillIfVisible(page, [
    'input[name*="age"]',
    'input[placeholder*="Age"]'
  ], testData.age);

  await fillIfVisible(page, [
    'input[name*="postalCode"]',
    'input[name*="postal"]',
    'input[placeholder*="postalCode"]'
  ], testData.postalCode);

  await clickIfVisible(page, [
    'label:has-text("Yes")',
    'text="Yes"'
  ]);

  await clickIfVisible(page, [
    'input[type="checkbox"]',
    'label:has-text("Terms")',
    'label:has-text("Declaration")'
  ]);
}

async function proceedToPayment(page: Page) {
  await clickIfVisible(page, [
    'button:has-text("Continue")',
    'button:has-text("Proceed")',
    'button:has-text("Pay Now")',
    'text="Continue"'
  ]);
}

async function getStripeFrame(page: Page): Promise<FrameLocator> {
  const frame = page.frameLocator('iframe[title*="Secure payment input frame"], iframe');
  return frame;
}

async function completeStripePayment(page: Page) {
  const frame = await getStripeFrame(page);

  await frame.locator('input[name="cardnumber"], input[placeholder*="1234"]').fill(testData.cardNumber);
  await frame.locator('input[name="exp-date"], input[placeholder*="MM / YY"]').fill(testData.expiry);
  await frame.locator('input[name="cvc"], input[placeholder*="CVC"]').fill(testData.cvc);

  const zip = frame.locator('input[name="postal"], input[placeholder*="ZIP"], input[placeholder*="Postal"]').first();
  if (await zip.count()) {
    await zip.fill(testData.postalCode);
  }

  await page.getByRole('button', { name: /pay/i }).last().click();
}

test.describe('PRS registration flows', () => {
  test('adult registration success flow', async ({ page }) => {
    await fillAdultRegistrationForm(page);
    await proceedToPayment(page);
    await completeStripePayment(page);

    await expect(page.locator('body')).toContainText(/confirmation|thank you|successful/i);
  });

  test('discount coupon flow', async ({ page }) => {
    await fillAdultRegistrationForm(page);

    const couponField = page.locator('input').filter({ has: page.locator('..') }).locator('xpath=ancestor-or-self::*').first();
    const codeInput = page.locator('input[name*="coupon"], input[placeholder*="coupon"], input[placeholder*="discount"]').first();

    if (await codeInput.count()) {
      await codeInput.fill(testData.promoCode);
    } else {
      await page.getByPlaceholder(/coupon|discount/i).fill(testData.promoCode);
    }

    await clickIfVisible(page, [
      'button:has-text("Apply")',
      'text="Apply"'
    ]);

    await expect(page.locator('body')).toContainText(/10%|discount/i);

    await proceedToPayment(page);
    await completeStripePayment(page);

    await expect(page.locator('body')).toContainText(/confirmation|thank you|successful/i);
  });

  test('payment failure and retry flow', async ({ page }) => {
    await fillAdultRegistrationForm(page);
    await proceedToPayment(page);

    await page.goBack();

    await expect(page.locator('body')).toContainText(/payment failed|failure|retry/i);

    await clickIfVisible(page, [
      'button:has-text("Retry Payment")',
      'button:has-text("Retry")',
      'text="Retry Payment"'
    ]);

    await completeStripePayment(page);

    await expect(page.locator('body')).toContainText(/confirmation|thank you|successful/i);
  });
});
