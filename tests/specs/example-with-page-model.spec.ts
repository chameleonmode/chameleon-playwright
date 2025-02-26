import { test } from '@playwright/test';
import { ExamplePage } from '../pages/example-page';

test.describe('Feature: User login', () => {
  let loginPage: ExamplePage;
  
  test.beforeEach(async ({ page }) => {
    loginPage = new ExamplePage(page);
    
    // Background: I am on the login page
    await test.step('Given I am on the login page', async () => {
      await loginPage.givenIAmOnTheLoginPage();
    });
  });
  
  test('Scenario: Successful login with valid credentials', async () => {
    await test.step('When I enter "testuser" as username', async () => {
      await loginPage.whenIEnterUsername('testuser');
    });
    
    await test.step('And I enter "password123" as password', async () => {
      await loginPage.andIEnterPassword('password123');
    });
    
    await test.step('And I click the login button', async () => {
      await loginPage.andIClickTheLoginButton();
    });
    
    await test.step('Then I should be redirected to the dashboard', async () => {
      await loginPage.thenIShouldBeRedirectedToDashboard();
    });
    
    await test.step('And I should see a welcome message with my name', async () => {
      await loginPage.andIShouldSeeWelcomeMessage('Test User');
    });
  });
  
  test('Scenario: Failed login with invalid credentials', async () => {
    await test.step('When I enter "testuser" as username', async () => {
      await loginPage.whenIEnterUsername('testuser');
    });
    
    await test.step('And I enter "wrongpassword" as password', async () => {
      await loginPage.andIEnterPassword('wrongpassword');
    });
    
    await test.step('And I click the login button', async () => {
      await loginPage.andIClickTheLoginButton();
    });
    
    await test.step('Then I should see an error message', async () => {
      await loginPage.thenIShouldSeeErrorMessage('Invalid username or password');
    });
    
    await test.step('And I should remain on the login page', async () => {
      await loginPage.andIShouldRemainOnLoginPage();
    });
  });
  
  test('Scenario: Form validation for required fields', async () => {
    await test.step('When I click the login button', async () => {
      await loginPage.andIClickTheLoginButton();
    });
    
    await test.step('Then I should see validation errors for required fields', async () => {
      await loginPage.thenIShouldSeeValidationErrors();
    });
  });
});