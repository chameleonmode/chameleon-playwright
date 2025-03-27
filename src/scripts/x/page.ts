import { Page } from "@playwright/test";
import Base from "../../lib/page.js";
import { random } from "../../lib/utils.js";

class X extends Base {
  constructor(readonly page: Page) {
    super(page, "https://x.com");
  }

  retweetButton = () => this.page.locator(`button[data-testid="retweet"]`);
  tweetBox = () => this.page.locator(`div[data-testid=tweetTextarea_0RichTextInputContainer]`);
  tweetButton = () => this.page.locator(`button[data-testid="tweetButtonInline"]`);
  locator = (selector: string) => {
    return this.page.locator(selector)
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

  loveTweet = async () => {
    const isAlreadyLiked = this.page.locator('div[aria-label*="Timeline"] div[data-testid="cellInnerDiv"]:first-child button[data-testid="unlike"]');
    const isAvailable = await isAlreadyLiked.count() > 0;
    if (!isAvailable) {
      const likeButton = this.page.locator('div[aria-label*="Timeline"] div[data-testid="cellInnerDiv"]:first-child button[data-testid="like"]').first();
      await likeButton.scrollIntoViewIfNeeded();
      await likeButton.click();
      console.log("Button clicked: Liked!");
    } else {
      await isAlreadyLiked.scrollIntoViewIfNeeded();
      console.log("Already liked")
    }
  }
  // Locators

  tweetToX = async (tweet: string) => {
    await this.tweetBox().waitFor();
    await this.tweetBox().click();
    await this.tweetBox().pressSequentially(tweet, { delay: random(128, 256) });
    await this.tweetButton().first().click();
  }

  // Search for a keyword on X
  async search(keyword: string) {
    await this.page.goto("https://x.com/explore"); // Go to X's explore page
    const searchInput = this.page.locator('input[placeholder="Search"]'); // Search bar
    await searchInput.fill(keyword); // Enter keyword
    await searchInput.press("Enter"); // Press enter to search
    await this.page.waitForLoadState("domcontentloaded"); // Wait for results to load
  }

  // Open the first profile matching the keyword
  async openFirstProfile(keyword: string, timeout: number = 5000) {
    const profileSelector = `a[href*="/${keyword}"]`;
    
    try {
        await this.page.waitForSelector(profileSelector, {
            state: 'attached',
            timeout: timeout
        });

        const profile = this.page.locator(profileSelector).first();
        
        await profile.scrollIntoViewIfNeeded();
        
        await Promise.all([
            this.page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
            profile.click()
        ]);
        
    } catch (error) {
        throw new Error(`Failed to open profile with keyword "${keyword}": ${error}`);
    }
}

  // Retweet the top most relevant tweet
  async retweetTopTweet() {
    const retweetButton = this.retweetButton().first(); 
    await retweetButton.click(); 
    const confirmReTweeetSelector = 'div[data-testid="retweetConfirm"]'
    await this.page.waitForSelector(confirmReTweeetSelector);
    const confirmButton = this.page.locator(confirmReTweeetSelector);
    await confirmButton.click();
  }
}

export default X;