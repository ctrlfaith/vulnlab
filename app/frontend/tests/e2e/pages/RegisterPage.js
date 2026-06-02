export class RegisterPage {
  constructor(page) {
    this.page = page;

    this.usernameInput = page.locator('input[type="text"]');
    this.emailInput    = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.registerTab   = page.locator('button:has-text("Register")');
    this.submitButton  = page.locator('button[type="submit"]');
    this.errorMessage  = page.locator('.text-red-400');
  }

  async goto() {
    await this.page.goto('/');
    await this.registerTab.click();
  }

  async register(username, email, password) {
    await this.usernameInput.fill(username);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectRedirectToNotes() {
    await this.page.waitForURL('**/notes');
  }
}