import { Page } from "@playwright/test";
import Base from "../../lib/page.js";
import { random } from "../../lib/utils.js";

class X extends Base {
  constructor(readonly page: Page) {
    super(page, "https://x.com");
  }

  // Check login  
  checkLoginAuthentication = async () => {
    try {
      const selector = "a[data-testid='loginButton']";
      const loginButton = this.page.locator(selector);
  
      try {
        await this.page.waitForSelector(selector, { state: 'visible' });
      } catch (error) {
        if (this.page.isClosed()) {
          console.log('The page was closed during the wait.');
          console.log('isAuthenticated: ', true);
          return true;
        }
        console.log(error);
      }
  
      const loginButtonCount = await loginButton.count();
      if (loginButtonCount > 0) {
        console.log('isAuthenticated: ', false);
        return false;
      }
  
      console.log('isAuthenticated: ', true);
      return true;
  
    } catch (error) {
      console.error('Error during authentication check:', error);
      return false;
    }
  };


  loginWithCredentials = async (email: string, userName: string, password: string) => {
    console.log('login proccess started...');
    const selector = "a[data-testid='loginButton']";
    const loginAnchor = this.page.locator(selector);
    await loginAnchor.waitFor({ state: 'visible' });
    const isLoginBtn = await loginAnchor.isVisible();

    if (isLoginBtn) {
      loginAnchor.click();
      const emailInput = this.page.locator('input[autocomplete="username"]');
      await emailInput.type(email, { delay: random(10, 50) });
      const emailNextButton = 'button:has-text("Next")';
      await this.page.waitForSelector(emailNextButton);
      await this.page.click(emailNextButton);

      const userNameInput = this.page.locator('input[data-testid="ocfEnterTextTextInput"]');
      await userNameInput.type(userName, { delay: random(10, 50) });
      const userNameNextButton = 'button[data-testid="ocfEnterTextNextButton"]';
      await this.page.waitForSelector(userNameNextButton);
      await this.page.click(userNameNextButton);

      const passwordInput = this.page.locator('input[name="password"]');
      await passwordInput.type(password, { delay: random(10, 50) });
      const loginButton = 'button[data-testid="LoginForm_Login_Button"]';
      await this.page.waitForSelector(loginButton);
      await this.page.click(loginButton);
      return true;
    }
  }

  loginWithGoogle = async (email: string, password: string) => {
    console.log('login proccess started...');
    const googleIframeSelector = 'iframe[title="Sign in with Google Button"]';
    await this.page.waitForSelector(googleIframeSelector, { state: "visible" });
    const googleButton = await this.page.locator(googleIframeSelector);
    await googleButton.click();

    const waitForOpenPopup = this.page.waitForEvent("popup");
    const popupDetailFilleds = await waitForOpenPopup;
    await popupDetailFilleds.waitForLoadState();

    const emailButtons = popupDetailFilleds.locator('[data-email]');
    const emailCount = await emailButtons.count();
    if (emailCount > 0) {
      await emailButtons.first().click();
    } else {
      const emailInput = popupDetailFilleds.getByLabel("Email or phone");
      await emailInput.waitFor({ state: "visible" });
      let isEmailValueEmpty = await emailInput.inputValue();

      const googleLoginNextButton = popupDetailFilleds.locator('div#identifierNext button');
      await googleLoginNextButton.waitFor({ state: 'visible' });

      if (!isEmailValueEmpty) {
        console.log('email not found!');
        await emailInput.type(email, { delay: random(10, 50) });
        await googleLoginNextButton.click();

        const passwordInput = popupDetailFilleds.getByLabel("Enter your password");
        await passwordInput.waitFor({ state: 'visible' });
        await passwordInput.type(password, { delay: random(10, 50) });

        const googleLoginPassNextButton = popupDetailFilleds.locator('div#passwordNext button');
        await googleLoginPassNextButton.waitFor({ state: 'visible' });
        await googleLoginPassNextButton.click();
      } else {
        await googleLoginNextButton.click();
      }
    }
  }
}

export default X;