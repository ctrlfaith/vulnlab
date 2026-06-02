export class NotesPage {
  constructor(page) {
    this.page = page;

    // Toolbar
    this.newNoteButton   = page.locator('button:has-text("New Note")');
    this.filterInput     = page.locator('input[placeholder="Filter by title / content..."]');

    // Modal — Create / Edit
    this.titleInput      = page.locator('input[placeholder="Note title..."]');
    this.contentTextarea = page.locator('textarea');
    this.saveButton      = page.locator('button:has-text("Create Note")');
    this.saveEditButton  = page.locator('button:has-text("Save Changes")');

    // Note cards
    this.noteCards = page.locator('.grid > div');
  }

  async goto() {
    await this.page.goto('/notes');
  }

  async waitForLoad() {
    await this.page.waitForSelector('text=Loading notes...', { state: 'hidden' });
  }

  async createNote(title, content) {
    await this.newNoteButton.click();
    await this.titleInput.fill(title);
    await this.contentTextarea.fill(content);
    await this.saveButton.click();
    await this.page.locator('.fixed.inset-0').waitFor({ state: 'hidden', timeout: 5000 });
    await this.waitForLoad();
  }

  async editFirstNote(newTitle, newContent) {
    const firstCard = this.noteCards.first();
    await firstCard.hover();
    await firstCard.locator('button:has-text("Edit")').click();
    await this.titleInput.clear();
    await this.titleInput.fill(newTitle);
    await this.contentTextarea.clear();
    await this.contentTextarea.fill(newContent);
    await this.saveEditButton.click();
    await this.waitForLoad();
  }

  async deleteFirstNote() {
    const ownCard = this.page.locator('.grid > div').filter({
      hasNot: this.page.locator('text=⚠ IDOR')
    }).first();

    await ownCard.evaluate(card => {
      const actionDiv = card.querySelector('div.flex.gap-1');
      if (!actionDiv) return;
      const buttons = actionDiv.querySelectorAll('button');
      const trashBtn = buttons[buttons.length - 1];
      trashBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });

    const deleteModal = this.page.locator('.fixed.inset-0').first();
    await deleteModal.waitFor({ state: 'visible', timeout: 5000 });
    await deleteModal.locator('button:has-text("Delete")').click();
    await this.waitForLoad();
  }

  async getFirstNoteTitle() {
    return await this.noteCards.first().locator('h3').textContent();
  }

  async getNoteCount() {
    return await this.noteCards.count();
  }

  async filterNotes(keyword) {
    await this.filterInput.fill(keyword);
  }
}