import { Locator, Page } from "@playwright/test";
import Base from "../page.js";
import { random, rando } from "../../lib/utils.js";

export class X extends Base {
  constructor(readonly page: Page) {
    super(page, "https://www.x.com", "X");
  }

  loginButton = () => this.page.locator(`a[data-testid='loginButton']`);
  searchInput = () => this.page.locator('input[placeholder="Search"]');
  retweetButton = () => this.page.locator(`button[data-testid="retweet"]`);
  articles = () => this.page.locator(`main[role="main"] section article`);
  replyBtnSelector = () => this.page.locator('div[data-testid="toolBar"] button[data-testid="tweetButton"]');
  tweetBox = () => this.page.locator(`div[data-testid="tweetTextarea_0RichTextInputContainer"]`);
  tweetButton = () => this.page.locator(`button[data-testid="tweetButtonInline"]`);

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

  // Search for the keyword on X
  async search(text: string) {
    await this.pressSequentially(this.searchInput(), text);
    await this.searchInput().press("Enter");
  }

  // Retweet the top most relevant tweet on X
  async retweetTopTweet() {
    const retweetButton = this.retweetButton().first();
    await this.bang("Retweet button not found or not visible", retweetButton.isVisible(), retweetButton);
    await retweetButton.click();

    const confirmSelector = ("retweetConfirm");
    await this.click(this.page.getByTestId(confirmSelector))
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

  // Function to reply to the tweet
  async replyToTweet(locator: Locator, reply: string) {
    locator.locator('button[data-testid="reply"]').click();
    const replySelector = 'div[data-viewportview="true"] div.DraftEditor-editorContainer';
    const replyBox = this.page.locator(replySelector);
    await this.bang("Reply box not found", replyBox.click(), replyBox);
    await replyBox.type(reply, { delay: random(50, 100) });
    await this.click(this.replyBtnSelector());
  }

  // tweet to X
  tweetToX = async (tweet: string) => {
    await this.pressSequentially(this.tweetBox(), tweet);
    await this.tweetButton().first().click();
  }

  // Love Tweet
  async loveTweet() {
    await this.scrollabit();
    const likeButtons = this.page.locator('button[data-testid*="like"]');
    const count = rando((await likeButtons.count()));
    for (let i = 0; i <= count; i++) {
      await this.click(likeButtons.nth(i));
    }
  }
}

export default async function (page: Page, url?: string) {
  const x = new X(page);
  await x.navigate(url || x.START_URL);
  return x;
}