import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage.js'
import { NotesPage } from './pages/NotesPage.js'

test.describe('Notes', () => {

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login('test3@test.com', 'password123')
    await loginPage.expectRedirectToNotes()
  })

  test('should display notes page', async ({ page }) => {
    const notesPage = new NotesPage(page)
    await expect(page).toHaveURL('/notes')
    await expect(notesPage.newNoteButton).toBeVisible()
  })

  test('should create a new note', async ({ page }) => {
    const notesPage = new NotesPage(page)
    await notesPage.waitForLoad()
    const before = await notesPage.getNoteCount()
    await notesPage.createNote(`Test Note ${Date.now()}`, 'This is a test content')
    await expect(notesPage.noteCards).toHaveCount(before + 1)
  })

  test('should edit a note', async ({ page }) => {
    const notesPage = new NotesPage(page)
    await notesPage.waitForLoad()

    const unique = Date.now()
    await notesPage.createNote(`Edit Target ${unique}`, 'Original content')
    await notesPage.waitForLoad()

    const newTitle = `Edited ${unique}`
    await notesPage.editFirstNote(newTitle, 'Updated content')

    await expect(notesPage.noteCards.first().locator('h3')).toHaveText(newTitle)
  })

  test('should delete a note', async ({ page }) => {
    const notesPage = new NotesPage(page)
    await notesPage.waitForLoad()

    await notesPage.createNote(`Delete Target ${Date.now()}`, 'To be deleted')
    await notesPage.waitForLoad()
    const before = await notesPage.getNoteCount()

    await notesPage.deleteFirstNote()

    await expect(notesPage.noteCards).toHaveCount(before - 1)
  })

  test('should show IDOR badge on notes owned by other users', async ({ page }) => {
  const notesPage = new NotesPage(page)
  await notesPage.waitForLoad()
  const actionGroup = notesPage.noteCards.first().locator('div.flex.flex-col.items-end')
  await expect(actionGroup).toHaveCSS('opacity', '0')
  await notesPage.noteCards.first().hover()
  await expect(actionGroup).toHaveCSS('opacity', '1')
  await expect(page.locator('text=⚠ IDOR').first()).toBeAttached()
})

test('should allow editing note of another user (IDOR exploit)', async ({ page }) => {
  const notesPage = new NotesPage(page)
  await notesPage.waitForLoad()

  const idorCard = page.locator('.grid > div', { has: page.locator('text=⚠ IDOR') }).first()
  await idorCard.evaluate(card => {
    for (const btn of card.querySelectorAll('button')) {
      if (btn.textContent.includes('Edit')) { btn.click(); break; }
    }
  })

  await expect(page.locator('text=⚠ IDOR').first()).toBeVisible({ timeout: 3000 })

  const newTitle = `IDOR Exploit ${Date.now()}`
  await notesPage.titleInput.clear()
  await notesPage.titleInput.fill(newTitle)
  await notesPage.saveEditButton.click()
  await notesPage.waitForLoad()

  await expect(page.locator('h3', { hasText: newTitle }).first()).toBeVisible()
})

})