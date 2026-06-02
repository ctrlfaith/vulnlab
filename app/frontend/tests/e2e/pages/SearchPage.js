export class SearchPage {
  constructor(page) {
    this.page = page;

    this.searchInput    = page.locator('input[placeholder="Search notes... or try \' OR 1=1 #"]');
    this.runButton      = page.locator('button:has-text("Run")');
    this.resultCards    = page.locator('.grid > div');
    this.sqliAlert      = page.locator('text=SQL Injection Detected');
    this.sqliDumpBadge  = page.locator('text=dumped via SQLi');
    this.resultCount    = page.locator('text=/\\d+ result/');
  }

  async goto() {
    await this.page.goto('/search');
  }

  async search(query) {
    await this.searchInput.fill(query);
    await this.runButton.click();
    await this.page.waitForSelector('text=/result|No results/', { timeout: 10000 });
  }

  async clickPayload(label) {
    await this.page.locator(`button:has-text("${label}")`).click();
    await this.page.waitForSelector('text=/result|No results/', { timeout: 10000 });
  }

  async getResultCount() {
    return await this.resultCards.count();
  }
}