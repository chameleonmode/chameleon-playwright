import { test, expect, Page } from '@playwright/test';

test.describe('Feature: User login', () => {
  test.describe.configure({ mode: 'serial' });
  
  // Shared variables
  let page: Page;
  
  test.beforeEach(async ({ browser }) => {
    // Background: New context for each test
    const context = await browser.newContext();
    page = await context.newPage();
    
    // Given I am on the login page
    await test.step('Given I am on the login page', async () => {
      await page.goto('https://example.com/login');
    });
  });
  
  test('Scenario: Successful login with valid credentials', async () => {
    // When I enter username
    await test.step('When I enter "testuser" as username', async () => {
      await page.fill('#username', 'testuser');
    });
    
    // And I enter password
    await test.step('And I enter "password123" as password', async () => {
      await page.fill('#password', 'password123');
    });
    
    // And I click the login button
    await test.step('And I click the login button', async () => {
      await page.click('#loginButton');
    });
    
    // Then I should be redirected to the dashboard
    await test.step('Then I should be redirected to the dashboard', async () => {
      await expect(page).toHaveURL(/dashboard/);
    });
    
    // And I should see a welcome message with my name
    await test.step('And I should see a welcome message with my name', async () => {
      await expect(page.locator('.welcome-message')).toContainText('Welcome, Test User');
    });
  });
  
  test('Scenario: Failed login with invalid credentials', async () => {
    // When I enter username
    await test.step('When I enter "testuser" as username', async () => {
      await page.fill('#username', 'testuser');
    });
    
    // And I enter wrong password
    await test.step('And I enter "wrongpassword" as password', async () => {
      await page.fill('#password', 'wrongpassword');
    });
    
    // And I click the login button
    await test.step('And I click the login button', async () => {
      await page.click('#loginButton');
    });
    
    // Then I should see an error message
    await test.step('Then I should see an error message', async () => {
      await expect(page.locator('.error-message')).toBeVisible();
      await expect(page.locator('.error-message')).toContainText('Invalid username or password');
    });
    
    // And I should remain on the login page
    await test.step('And I should remain on the login page', async () => {
      await expect(page).toHaveURL(/login/);
    });
  });
  
  test('Scenario: Form validation for required fields', async () => {
    // When I click the login button without entering credentials
    await test.step('When I click the login button', async () => {
      await page.click('#loginButton');
    });
    
    // Then I should see validation errors
    await test.step('Then I should see validation errors for required fields', async () => {
      await expect(page.locator('#username-error')).toBeVisible();
      await expect(page.locator('#password-error')).toBeVisible();
    });
  });
});