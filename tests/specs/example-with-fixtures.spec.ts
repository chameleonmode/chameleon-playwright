import { test, expect } from '../fixtures';

test.describe('Feature: User login', () => {
  test.beforeEach(async ({ examplePage: loginPage }) => {
    // Background: I am on the login page
    await test.step('Given I am on the login page', async () => {
      await loginPage.givenIAmOnTheLoginPage();
    });
  });
  
  test('Scenario: Successful login with valid credentials', async ({ examplePage: loginPage }) => {
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
  
  // Additional scenarios...
});