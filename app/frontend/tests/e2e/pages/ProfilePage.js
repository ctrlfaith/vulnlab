export class ProfilePage {
  constructor(page) {
    this.page = page;

    this.switchIdInput  = page.locator('input[placeholder="Enter user id..."]');
    this.switchButton   = page.locator('button:has-text("Switch")');

    this.usernameDisplay = page.locator('.font-mono.text-lg.font-bold');
    this.idBadge         = page.locator('span:has-text("id:")');
    this.youBadge        = page.locator('span:has-text("you")');
    this.warningBanner   = page.locator('text=⚠ Viewing profile of');

    this.editButton      = page.locator('button:has-text("Edit")');
    this.usernameInput   = page.locator('input[type="text"]');
    this.emailInput      = page.locator('input[type="email"]');
    this.saveButton      = page.locator('button:has-text("Save")');
    this.cancelButton    = page.locator('button:has-text("Cancel")');

    this.idorWarning     = page.locator('text=⚠ IDOR: Saving will update');

    this.successToast    = page.locator('text=✓ Profile updated');
    this.errorToast      = page.locator('text=[ERR] Failed to update profile');
  }

  async goto(id = null) {
    const url = id ? `/profile?id=${id}` : '/profile';
    await this.page.goto(url);
    await this.page.waitForSelector('text=Loading profile...', { state: 'hidden' });
  }

  async switchToUser(id) {
    await this.switchIdInput.fill(String(id));
    await this.switchButton.click();
    await this.page.waitForSelector('text=Loading profile...', { state: 'hidden' });
  }

  async editProfile(username, email) {
    await this.editButton.click();
    await this.usernameInput.fill(username);
    await this.emailInput.fill(email);
    await this.saveButton.click();
    await this.successToast.waitFor({ timeout: 5000 });
  }

  async isViewingOwnProfile() {
    return await this.youBadge.isVisible();
  }

  async isWarningVisible() {
    return await this.warningBanner.isVisible();
  }

  async isIdorWarningVisible() {
    return await this.idorWarning.isVisible();
  }
}