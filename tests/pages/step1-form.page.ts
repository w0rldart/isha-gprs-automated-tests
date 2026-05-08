import { type Page, expect } from '@playwright/test';
import type { TestData } from '../helpers/test-data';

/**
 * Page Object for Step 1 — the registration form.
 *
 * Covers: personal details, address, dietary question, T&Cs, and submit.
 */
export class Step1FormPage {
  constructor(private page: Page) {}

  // ── Navigation ──────────────────────────────────────────────

  async goto(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page.getByText(/personal details/i)).toBeVisible();
  }

  // ── Text inputs ─────────────────────────────────────────────

  async fillFirstName(value: string) {
    await this.page.getByLabel(/first name/i).fill(value);
  }

  async fillLastName(value: string) {
    await this.page.getByLabel(/last name/i).fill(value);
  }

  async fillEmail(value: string) {
    await this.page.getByLabel(/^email/i).fill(value);
  }

  async fillPhone(value: string, countryName: string, index = 0) {
    const container = this.page.locator('.react-tel-input').nth(index);

    // Open the country flag dropdown
    await container.locator('.selected-flag').click();

    // Search for and select the matching country
    const searchBox = container.locator('input[placeholder="search"], .search-box');
    await searchBox.fill(countryName);
    await container
      .locator('.country-list li.country')
      .filter({ hasText: countryName })
      .first()
      .click();

    // Type digit-by-digit so react-tel-input reformats on each keystroke
    const input = container.locator('input.form-control[type="tel"]');
    await input.click();
    await input.pressSequentially(value, { delay: 50 });
  }

  async fillAge(value: string) {
    await this.page.getByRole('spinbutton', { name: /age/i }).fill(value);
  }

  async fillPostalCode(value: string) {
    await this.page.getByLabel(/pincode.*zip.*postal/i).fill(value);
  }

  async fillCity(value: string) {
    await this.page.getByLabel(/city.*town.*village/i).fill(value);
  }

  async fillAddress(value: string) {
    await this.page.getByLabel(/^address/i).fill(value);
  }

  // ── Radio groups ────────────────────────────────────────────

  async selectWhatsAppSameAsPhone(same: boolean) {
    await this.checkRadio('is_whatsapp_same_as_phone', same ? 'Yes' : 'No');
  }

  async selectDietaryRestrictions(data: TestData) {
    await this.checkRadio('has_food_allergy', data.dietaryRestrictions ? 'Yes' : 'No');

    if (data.dietaryRestrictions) {
      await this.fillDietaryDetails(data.dietaryDetails);
      await this.selectAllergySeverity(data.allergySeverity);
    }
  }

  async fillDietaryDetails(value: string) {
    await this.page
      .getByLabel(/doctor-prescribed dietary restrictions|special needs/i)
      .fill(value);
  }

  async selectAllergySeverity(option: string) {
    await this.pickReactSelectOption('How severe is your allergy', option);
  }

  // ── React-Select dropdowns ──────────────────────────────────

  async selectGender(option: string) {
    await this.pickReactSelectOption('Gender', option);
  }

  async selectCountry(option: string) {
    await this.pickReactSelectOption('Country', option);
  }

  async selectState(option: string) {
    await this.pickReactSelectOption('State', option);
  }

  // ── Terms & Conditions ──────────────────────────────────────

  async acceptTerms() {
    // Scroll the GDPR section so the consent checkbox becomes enabled
    await this.scrollTermsIntoView();

    const gdprConsent = this.page.locator('#tnc_gdpr_consent');
    if (await gdprConsent.count()) {
      await expect(gdprConsent).toBeEnabled({ timeout: 10_000 });
      await gdprConsent.check({ force: true });
    }

    const programTerms = this.page.locator('#tnc_refund');
    if (await programTerms.count()) {
      await programTerms.check({ force: true });
    }
  }

  // ── Submit ──────────────────────────────────────────────────

  async submit() {
    await this.page.getByRole('button', { name: /complete your registration/i }).click();
  }

  // ── Convenience: fill the entire step-1 form ────────────────

  async fillAll(data: TestData) {
    await this.fillFirstName(data.firstName);
    await this.fillLastName(data.lastName);
    await this.fillEmail(data.email);
    await this.fillPhone(data.phone, data.country);

    await this.selectWhatsAppSameAsPhone(data.whatsappSameAsPhone);
    if (!data.whatsappSameAsPhone) {
      await this.fillPhone(data.waPhone, data.country, 1);
    }

    await this.selectGender(data.gender);
    await this.fillAge(data.age);

    await this.selectCountry(data.country);
    await this.fillPostalCode(data.postalCode);
    await this.selectState(data.state);
    await this.fillCity(data.city);
    await this.fillAddress(data.address);

    await this.selectDietaryRestrictions(data);
    await this.acceptTerms();
  }

  // ── Locator helpers (used by specs for assertions) ──────────

  phoneInput(index = 0) {
    return this.page.locator('.react-tel-input input.form-control[type="tel"]').nth(index);
  }

  // ── Private helpers ─────────────────────────────────────────

  private async checkRadio(name: string, value: 'Yes' | 'No') {
    await this.page
      .locator(`input[type="radio"][name="${name}"][value="${value}"]`)
      .check({ force: true });
  }

  private async pickReactSelectOption(label: string, optionText: string) {
    const group = this.page
      .locator('div[role="group"]')
      .filter({
        has: this.page.locator('label', { hasText: new RegExp(`^${label}`, 'i') }),
      })
      .first();

    // Click the visible control container — the placeholder div overlays
    // the combobox input and intercepts direct clicks on it
    await group.locator('.react-select__control').click();

    const combobox = group.getByRole('combobox');
    await combobox.fill(optionText);

    // react-select renders the option list globally — use .last() to skip
    // any label text that also matches
    const escaped = optionText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await this.page.getByText(new RegExp(`^${escaped}$`, 'i')).last().click();
  }

  private async scrollTermsIntoView() {
    const termsWrapper = this.page
      .locator('div, section')
      .filter({ has: this.page.getByText(/gdpr consent/i) })
      .first();

    await termsWrapper.locator('div').evaluateAll((nodes) => {
      for (const node of nodes) {
        const el = node as HTMLElement;
        if (el.scrollHeight > el.clientHeight) {
          el.scrollTop = el.scrollHeight;
          el.dispatchEvent(new Event('scroll', { bubbles: true }));
        }
      }
    });
  }
}
