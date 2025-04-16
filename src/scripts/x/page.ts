import { Page } from "@playwright/test";
import Base from "../page.js";

export class X extends Base {
  constructor(readonly page: Page) {
    super(page, "https://www.x.com", "X");
  }

  loginButton = () => this.page.locator(`a[data-testid='loginButton']`);

  // Check login authentication
  checkLoginAuthentication = async () => {
    // Get all cookies
    const cookies = await this.page.context().cookies();
    const authCookie = cookies.find(cookie => cookie.name === 'auth_token');
    const twId = cookies.find(cookie => cookie.name === 'twid');
    this.bang("Login button not found", !authCookie || !twId, authCookie);
  }

  // Login with credentials
  loginWithCredentials = async (email: string, userName: string, password: string) => {
    // Click the main login button
    await this.click(this.loginButton());

    // Enter email
    const emailInput = this.page.locator('input[autocomplete="username"]');
    await this.pressSequentially(emailInput, email);

    // Click next after email
    const emailNextButton = this.page.locator(`button:has-text("Next")`);
    await this.click(emailNextButton);

    // Enter user name if needed
    const userNameInput = this.page.locator('input[data-testid="ocfEnterTextTextInput"]');
    if (await userNameInput.isVisible()) {
      await this.pressSequentially(userNameInput, userName);
      // Click next after user name
      const userNextButton = this.page.locator(`button[data-testid="ocfEnterTextNextButton"]`);
      await this.click(userNextButton);
    }

    // Enter password
    const passwordInput = this.page.locator('input[name="password"]');
    await this.pressSequentially(passwordInput, password);

    // Complete login
    const submitLoginButton = this.page.locator(`button[data-testid="LoginForm_Login_Button"]`);
    this.click(submitLoginButton);
  };

  // Login google
  loginWithGoogle = async (email: string, password: string) => {
    const frameSelector = 'iframe[src*="accounts.google.com/gsi/button"], iframe[allow="identity-credentials-get"], iframe[id^="gsi_"], iframe[title="Sign in with Google Button"], iframe[title*="Google"]'
    await this.page.waitForSelector(frameSelector, { state: 'attached' });

    const { frame } = await this.findFrame(frameSelector.split(','));
    await frame.locator('div[role="button"]').click();

    // Step 3: Handle the Google authentication popup
    const popup = await this.page.waitForEvent("popup");
    await popup.waitForLoadState();

    // Check if we have saved accounts to select from
    const emailButtons = popup.locator("[data-email]");
    if ((await emailButtons.count()) > 0) {
      // Use existing account
      return await emailButtons.first().click();
    }

    // Enter email
    const emailInput = popup.getByLabel("Email or phone");
    await this.pressSequentially(emailInput, email);

    // Click next after email
    const nextButton = popup.locator("div#identifierNext button");
    await this.click(nextButton);

    // Enter password if needed
    const passwordInput = popup.getByLabel("Enter your password");
    await this.pressSequentially(passwordInput, password);

    // Complete login
    const passwordNextButton = popup.locator("div#passwordNext button");
    await this.click(passwordNextButton);
  }
}

export default async function (page: Page, url?: string) {
  const x = new X(page);
  await x.navigate(url || x.START_URL);
  return x;
}