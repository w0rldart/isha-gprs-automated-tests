import { type Page, expect } from '@playwright/test';
import type { TestData } from '../helpers/test-data';

/**
 * Page Object for Step 2 — the payment summary / promo / pay screen.
 */
export class Step2PaymentPage {
  constructor(private page: Page) {}

  // ── Assertions ──────────────────────────────────────────────

  async expectVisible() {
    await expect(this.page.getByText(/payment summary/i)).toBeVisible();
    await expect(this.page.getByText(/do you have a discount code/i)).toBeVisible();
  }

  // ── Promo code ──────────────────────────────────────────────

  async applyPromoCode(code: string) {
    await this.page.getByTestId('coupon-field').fill(code);
    await this.page.getByRole('button', { name: /apply/i }).click();
    await expect(
      this.page.getByText(/coupon code applied successfully|discount/i),
    ).toBeVisible();
  }

  // ── Payment ─────────────────────────────────────────────────

  async pay() {
    await this.page.getByRole('button', { name: /pay now/i }).click();
  }

  async completeStripePayment(data: Pick<TestData, 'cardNumber' | 'expiry' | 'cvc' | 'postalCode'>) {
    const frame = this.page
      .frameLocator('iframe[title*="Secure payment input frame"], iframe')
      .first();

    await frame.locator('input[name="cardnumber"], input[placeholder*="1234"]').fill(data.cardNumber);
    await frame.locator('input[name="exp-date"], input[placeholder*="MM / YY"]').fill(data.expiry);
    await frame.locator('input[name="cvc"], input[placeholder*="CVC"]').fill(data.cvc);

    const postal = frame
      .locator('input[name="postal"], input[placeholder*="ZIP"], input[placeholder*="Postal"]')
      .first();

    if (await postal.count()) {
      await postal.fill(data.postalCode);
    }

    await this.page.getByRole('button', { name: /pay/i }).last().click();
  }

  async expectSuccess() {
    await expect(this.page.locator('body')).toContainText(
      /confirmation|thank you|successful/i,
    );
  }
}
