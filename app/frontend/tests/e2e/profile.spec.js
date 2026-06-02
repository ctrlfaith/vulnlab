import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage.js'
import { ProfilePage } from './pages/ProfilePage.js'

test.describe('Profile', () => {

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login('test3@test.com', 'password123')
    await loginPage.expectRedirectToNotes()
  })

  test('should display own profile', async ({ page }) => {
    const profilePage = new ProfilePage(page)
    await profilePage.goto()
    expect(await profilePage.isViewingOwnProfile()).toBe(true)
    await expect(profilePage.warningBanner).not.toBeVisible()
  })

  test('should show warning when viewing another user profile (BAC)', async ({ page }) => {
    const profilePage = new ProfilePage(page)
    await profilePage.goto()
    await profilePage.switchToUser(4)
    expect(await profilePage.isViewingOwnProfile()).toBe(false)
    expect(await profilePage.isWarningVisible()).toBe(true)
  })

  test('should show IDOR warning when editing another user profile', async ({ page }) => {
    const profilePage = new ProfilePage(page)
    await profilePage.goto()
    await profilePage.switchToUser(4)
    await profilePage.editButton.click()
    expect(await profilePage.isIdorWarningVisible()).toBe(true)
  })

  test('should edit own profile', async ({ page }) => {
  const profilePage = new ProfilePage(page)
  await profilePage.goto()

  const unique = Date.now()
  const newUsername = `testuser${unique}`

  await profilePage.editButton.click()

  await profilePage.usernameInput.clear()
  await profilePage.usernameInput.fill(newUsername)

  await profilePage.saveButton.click()
  await profilePage.successToast.waitFor({ timeout: 5000 })

  await expect(profilePage.usernameDisplay).toContainText(newUsername)
})

test('should allow editing another user profile (IDOR exploit)', async ({ page }) => {
  const profilePage = new ProfilePage(page)
  await profilePage.goto()
  await profilePage.switchToUser(4)

  const unique = Date.now()
  const exploitUsername = `idor${unique}`

  await profilePage.editButton.click()

  expect(await profilePage.isIdorWarningVisible()).toBe(true)

  await profilePage.usernameInput.clear()
  await profilePage.usernameInput.fill(exploitUsername)
  await profilePage.saveButton.click()

  await profilePage.successToast.waitFor({ timeout: 5000 })
  await expect(profilePage.usernameDisplay).toContainText(exploitUsername)
})

})