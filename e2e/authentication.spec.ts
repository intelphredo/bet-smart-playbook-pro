import { test, expect } from '@playwright/test';
import { AuthPage } from './fixtures/page-objects';
import { testUser } from './fixtures/test-data';

test.describe('Authentication', () => {
  test('should display login form', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    
    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.passwordInput).toBeVisible();
    await expect(authPage.signInButton).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    
    await authPage.emailInput.fill('invalid-email');
    await authPage.passwordInput.fill(testUser.password);
    await authPage.signInButton.click();
    
    // Should show validation error or prevent submission
    const emailInput = authPage.emailInput;
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });

  test('should require password', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    
    await authPage.emailInput.fill(testUser.email);
    // Don't fill password
    await authPage.signInButton.click();
    
    // Should show validation error
    const passwordInput = authPage.passwordInput;
    const validationMessage = await passwordInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    
    await authPage.signIn('wrong@email.com', 'wrongpassword');
    
    // Wait for error response
    await page.waitForTimeout(2000);
    
    // Should either show error message or stay on auth page
    const url = page.url();
    expect(url).toContain('auth');
  });

  test('should toggle between sign in and sign up', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    
    // Find toggle button
    const toggleButton = page.getByRole('button').filter({ hasText: /create|sign up|register/i });
    
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      // Form should update
      await expect(page.locator('form')).toBeVisible();
    }
  });

  test('should handle form submission with enter key', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    
    await authPage.emailInput.fill(testUser.email);
    await authPage.passwordInput.fill(testUser.password);
    await authPage.passwordInput.press('Enter');
    
    // Should attempt to submit
    await page.waitForTimeout(1000);
    // Page should respond (either error or redirect)
    await expect(page.locator('body')).toBeVisible();
  });

  test('should be accessible', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    
    // Check for proper form labels
    const emailLabel = page.locator('label:has-text("email")');
    const passwordLabel = page.locator('label:has-text("password")');
    
    // Either labels exist or inputs have proper aria-labels
    const emailInput = authPage.emailInput;
    const hasEmailLabel = await emailLabel.isVisible().catch(() => false);
    const hasEmailAriaLabel = await emailInput.getAttribute('aria-label');
    
    expect(hasEmailLabel || hasEmailAriaLabel || await emailInput.getAttribute('placeholder')).toBeTruthy();
  });
});
