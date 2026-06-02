export class LoginPage {
  constructor(page) {
    this.page = page;

    this.emailInput    = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton  = page.locator('button[type="submit"]'); 
    this.errorMessage  = page.locator('.text-red-400');
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }

  async expectRedirectToNotes() {
    await this.page.waitForURL('**/notes');
  }
}