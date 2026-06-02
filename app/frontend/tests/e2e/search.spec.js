import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage.js'
import { SearchPage } from './pages/SearchPage.js'

test.describe('Search', () => {

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login('test3@test.com', 'password123')
    await loginPage.expectRedirectToNotes()
  })

  test('should display search page', async ({ page }) => {
    const searchPage = new SearchPage(page)
    await searchPage.goto()
    await expect(searchPage.searchInput).toBeVisible()
    await expect(searchPage.runButton).toBeVisible()
  })

  test('should return results for normal search', async ({ page }) => {
    const searchPage = new SearchPage(page)
    await searchPage.goto()
    await searchPage.search('test')
    await expect(searchPage.resultCards.first()).toBeVisible()
  })

  test('should detect SQLi payload and show alert', async ({ page }) => {
    const searchPage = new SearchPage(page)
    await searchPage.goto()
    await searchPage.search("' OR 1=1 #")
    await expect(searchPage.sqliAlert).toBeVisible()
    await expect(searchPage.sqliDumpBadge).toBeVisible()
  })

})