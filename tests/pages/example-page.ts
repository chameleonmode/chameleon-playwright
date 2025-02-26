import { Page, expect } from '@playwright/test';

export class ExamplePage {
  constructor(private page: Page) {}
  
  // Locators
  usernameInput = () => this.page.locator('#username');
  passwordInput = () => this.page.locator('#password');
  loginButton = () => this.page.locator('#loginButton');
  errorMessage = () => this.page.locator('.error-message');
  usernameError = () => this.page.locator('#username-error');
  passwordError = () => this.page.locator('#password-error');
  welcomeMessage = () => this.page.locator('.welcome-message');
  
  // Step definitions
  async givenIAmOnTheLoginPage() {
    await this.page.goto('https://example.com/login');
  }
  
  async whenIEnterUsername(username: string) {
    await this.usernameInput().fill(username);
  }
  
  async andIEnterPassword(password: string) {
    await this.passwordInput().fill(password);
  }
  
  async andIClickTheLoginButton() {
    await this.loginButton().click();
  }
  
  async thenIShouldBeRedirectedToDashboard() {
    await expect(this.page).toHaveURL(/dashboard/);
  }
  
  async andIShouldSeeWelcomeMessage(name: string) {
    await expect(this.welcomeMessage()).toContainText(`Welcome, ${name}`);
  }
  
  async thenIShouldSeeErrorMessage(message: string) {
    await expect(this.errorMessage()).toBeVisible();
    await expect(this.errorMessage()).toContainText(message);
  }
  
  async andIShouldRemainOnLoginPage() {
    await expect(this.page).toHaveURL(/login/);
  }
  
  async thenIShouldSeeValidationErrors() {
    await expect(this.usernameError()).toBeVisible();
    await expect(this.passwordError()).toBeVisible();
  }
}