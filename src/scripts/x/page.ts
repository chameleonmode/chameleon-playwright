import { Page, Locator } from "@playwright/test";
import Base from "../../lib/page.js";
import { random, sleepRandom } from "../../lib/utils.js";

class X extends Base {
  constructor(readonly page: Page) {
    super(page, "https://www.x.com", "X");
  }

  retweetButton = () => this.page.locator(`button[data-testid="retweet"]`);
  profileButton = () => this.page.locator(`a[data-testid="AppTabBar_Profile_Link"]`);
  tweetBox = () => this.page.locator(`div[data-testid="tweetTextarea_0RichTextInputContainer"]`);
  tweetButton = () => this.page.locator(`button[data-testid="tweetButtonInline"]`);
  loginButton = () => this.page.locator(`a[data-testid='loginButton']`);
  emailNextButton = () => this.page.locator(`button:has-text("Next")`);
  userNameNextButton = () => this.page.locator(`button[data-testid="ocfEnterTextNextButton"]`);
  loginFormSubmitButton = () => this.page.locator(`button[data-testid="LoginForm_Login_Button"]`);
  articles = () => this.page.locator(`main[role="main"] section article`);
  searchInput = () => this.page.locator('input[placeholder="Search"]');
  locator = (selector: string) => {
    return this.page.locator(selector)
  }

  // Check login authentication
  checkLoginAuthentication = async () => {
    // Get all cookies
    const cookies = await this.page.context().cookies();
    // check auth cookies is availble
    const authCookie = cookies.find(cookie => cookie.name === 'auth_token');
    const twId = cookies.find(cookie => cookie.name === 'twid');
    this.bang("Login cookies not found", !authCookie || !twId, authCookie);
  }

  // Login with credentials 
  loginWithCredentials = async (email: string, userName: string, password: string) => {
    this.loginButton().click();

    const emailInput = this.locator('input[autocomplete="username"]');
    await this.bang("Email input not found", emailInput.isVisible(), emailInput);
    await emailInput.click();
    await this.type(email);
    await this.bang("Email submit button not found", this.emailNextButton().isVisible(), this.emailNextButton());
    this.emailNextButton().click();

    const userNameInput = this.locator('input[data-testid="ocfEnterTextTextInput"]');
    if (userNameInput) {
      await this.bang("Username input not found", userNameInput.isVisible(), userNameInput);
      await userNameInput.click();
      await this.type(userName);
      this.userNameNextButton().click();
    }
    const passwordInput = this.locator('input[name="password"]');
    await this.bang("Password input not found", passwordInput.isVisible(), passwordInput);
    await passwordInput.click();
    await this.type(password);
    this.loginFormSubmitButton().click();
  }

  // Login with goole
  loginWithGoogle = async (email: string, password: string) => {
    const googleIframeSelector = 'iframe[title="Sign in with Google Button"]';
    const googleButton = this.page.locator(googleIframeSelector);
    await this.bang("Google button not found", googleButton.isVisible(), googleButton);
    await googleButton.click();

    const detailsPopup = await this.page.waitForEvent("popup");
    await detailsPopup.waitForLoadState();
    const emailButtons = detailsPopup.locator("div[data-email]");

    if (await emailButtons.count() > 0) {
      await emailButtons.first().click();
    } else {
      const emailInput = detailsPopup.locator('input[aria-label="Email or phone"]');
      await this.bang("Email input not found", emailInput.isVisible(), emailInput);

      let isEmailValueEmpty = await emailInput.inputValue();
      const googleLoginNextButton = detailsPopup.locator("div#identifierNext button");
      await this.bang("Email next button not found", googleLoginNextButton.isVisible(), googleLoginNextButton);

      if (!isEmailValueEmpty) {
        await emailInput.type(email, { delay: random(50, 100) });
        await googleLoginNextButton.click();

        const passwordInput = detailsPopup.locator('input[aria-label="Enter your password"]');
        await this.bang("Password input not found", passwordInput.isVisible(), passwordInput);
        await passwordInput.type(password, { delay: random(50, 100) });

        const googleLoginPassNextButton = detailsPopup.locator("div#passwordNext button");
        await this.bang("Password next button not found", googleLoginPassNextButton.isVisible(), googleLoginPassNextButton);
        await googleLoginPassNextButton.click();
      } else {
        await googleLoginNextButton.click();
      }
    }
  };

  // Search for a keyword on X
  async search(keyword: string) {
    await this.bang("Search text box not found", this.searchInput().isVisible(), this.searchInput());
    await this.searchInput().click();
    await this.type(keyword);
    await this.searchInput().press("Enter");
  }

  // Retweet the top most relevant tweet on X
  async retweetTopTweet() {
  const retweetButton = this.retweetButton().first();
  await this.bang("Retweet button not found or not visible", retweetButton.isVisible(), retweetButton);
  await retweetButton.click();

  const confirmSelector = 'div[data-testid="retweetConfirm"]';
  const confirmButton = this.page.locator(confirmSelector);
  await this.bang("Retweet confirmation button not found", confirmButton.isVisible(), confirmButton);
  await confirmButton.click();
}

  // Function to get a comment
  async getTweet(nth = 2, random = Math.random() < 0.5) {
  const comment = this.bang(
    "Comment not found",
    random
      ? this.articles().nth(Math.floor(Math.random() * (await this.articles().count())))
      : this.articles().nth(nth)
  );
  // Use a more specific selector to avoid nested matches
  const commentContent = comment.locator('div[data-testid="tweetText"]').first();
  commentContent.scrollIntoViewIfNeeded();
  return {
    text: await commentContent.innerText(),
    locator: comment,
  };
}

  async replyToTweet(locator: Locator, reply: string) {
    await sleepRandom({ multiplier: 4 });
    locator.locator('button[data-testid="reply"]').click();
    const replySelector = 'div[data-viewportview="true"] div.DraftEditor-editorContainer';
    const replyBox = this.locator(replySelector);
    await this.bang("Reply box not found", replyBox.isVisible(), replyBox);
    replyBox.click();
    await replyBox.type(reply, { delay: random(50, 100) });

    const replyBtnSelector = 'div[data-testid="toolBar"] button[data-testid="tweetButton"]';
    const replyButton = this.locator(replyBtnSelector);
    await this.bang("Reply box not found", replyButton.isVisible(), replyButton);
    await replyButton.click();
  }
}

export default async function (page: Page, url?: string) {
  const twitter = new X(page);
  await twitter.navigate(url || twitter.START_URL);
  return twitter;
}
