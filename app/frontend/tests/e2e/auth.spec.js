import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage.js'
import { RegisterPage } from './pages/RegisterPage.js'

test.describe('Auth', () => {

  test('register a new user', async ({ page }) => {
    const registerPage = new RegisterPage(page)
    const unique = Date.now()
    await registerPage.goto()
    await registerPage.register(`testuser${unique}`, `testuser${unique}@test.com`, 'password123')
    await registerPage.expectRedirectToNotes()
  })

  test('login with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login('testuser1@test.com', 'password123')
    await loginPage.expectRedirectToNotes()
  })

  test('login with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login('wrong@test.com', 'wrongpassword')
    await expect(page).toHaveURL('/')
    await expect(page.locator('.text-red-400')).toBeVisible()
  })

  test('redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/notes')
    await expect(page).toHaveURL('/')
  })

})