import { Locator, Page, expect } from "@playwright/test";
import { random, rando, sleepRandom } from "../../lib/utils.js";
import Base from "../page.js";

export class Reddit extends Base {
  constructor(readonly page: Page) {
    super(page, "https://www.reddit.com", "Reddit");
  }

  // Locators
  searchTextBox = () => this.page.locator(`faceplate-search-input`).getByRole("textbox");
  commentButton = () => this.page.getByRole("button", { name: "Add a comment" });
  nextButton = () => this.page.getByRole("button", { name: "Next" });
  loginButton = () => this.page.locator("#login-button");

  // get the text content of a locator
  locatorTxtContent = async (selector: string, locator?: Locator) => {
    const element = locator?.locator(selector).first() || this.page.locator(selector).first();
    await expect(element).toBeVisible();

    return this.bang(
      "Element not found in" + selector,
      await element.evaluate((ele) => ele?.textContent?.replace(/\s+/g, " ").trim())
    );
  };

  // Get post title content
  postTitleText = () => this.locatorTxtContent('h1[id^="post-title-"][slot="title"]');

  // Check authentication
  checkLoginAuthentication = async () =>
    this.bang("Login button not found", await this.loginButton().isVisible(), this.loginButton());

  // Login with credentials
  loginWithCredentials = async (email: string, password: string) => {
    console.log("login proccess started...");
    const loginButton = this.loginButton();
    await expect(loginButton).toBeVisible();
    loginButton.click();

    const loginUserName = this.page.locator("faceplate-text-input#login-username");
    loginUserName.click();

    const loginUserNameInput = loginUserName.locator("input");
    await loginUserNameInput.type(email, { delay: random(50, 100) });
    await loginUserNameInput.press("Tab");

    const loginUserPassword = this.page.locator("faceplate-text-input#login-password");
    loginUserPassword.click();

    const loginUserPasswordInput = loginUserPassword.locator("input");
    await loginUserPasswordInput.type(password, { delay: random(50, 100) });
    const loginUserButton = this.page.getByRole("button", { name: "Log In" });

    await expect(loginUserButton).toBeVisible();
    loginUserButton.click();
    return true;
  };

  // Login google
  loginWithGoogle = async (email: string, password: string) => {
    console.log("login proccess started...");
    const loginButton = this.loginButton();
    await expect(loginButton).toBeVisible();
    loginButton.click();

    const googleIframeSelector = 'iframe[title="Sign in with Google Button"]';
    await this.page.waitForSelector(googleIframeSelector, { state: "visible" });
    const googleButton = this.page.locator(googleIframeSelector);
    await googleButton.click();

    const waitForOpenPopup = this.page.waitForEvent("popup");
    const popupDetailFilleds = await waitForOpenPopup;
    await popupDetailFilleds.waitForLoadState();

    const emailButtons = popupDetailFilleds.locator("[data-email]");
    const emailCount = await emailButtons.count();

    if (emailCount > 0) {
      await emailButtons.first().click();
    } else {
      const emailInput = popupDetailFilleds.getByLabel("Email or phone");
      await emailInput.waitFor({ state: "visible" });
      let isEmailValueEmpty = await emailInput.inputValue();

      const googleLoginNextButton = popupDetailFilleds.locator("div#identifierNext button");
      await googleLoginNextButton.waitFor({ state: "visible" });

      if (!isEmailValueEmpty) {
        console.log("email not found!");
        await this.pressSequentially(emailInput, email);
        await googleLoginNextButton.click();

        const passwordInput = popupDetailFilleds.getByLabel("Enter your password");
        await passwordInput.waitFor({ state: "visible" });
        await passwordInput.type(password, { delay: random(50, 100) });

        const googleLoginPassNextButton = popupDetailFilleds.locator("div#passwordNext button");
        await googleLoginPassNextButton.waitFor({ state: "visible" });
        await googleLoginPassNextButton.click();
      } else {
        await googleLoginNextButton.click();
      }
    }
  };

  async search(text: string) {
    await this.pressSequentially(this.searchTextBox(), text);
    await this.searchTextBox().press("Enter");
  }

  async findRandoThread(func?: () => Promise<void>) {
    if (!func) {
      func = () => expect(this.commentButton()).toBeVisible({ timeout: 5000 });
    }
    await this.page.getByRole("button", { name: "Posts" }).click();

    const triedIndices: number[] = [];
    const maxAttempts = 18;
    for (let i = 0; i < maxAttempts; i++) {
      console.debug(`Attempts remaining: ${maxAttempts - i}`);
      await this.waitForNavigation();
      await sleepRandom();

      // Wait for thread elements to be available
      const { count, locator, id } = await this.test([
        "search-post-with-content-preview",
        "search-post-unit",
      ]);

      // Filter out indices we've already tried
      const availableIndices = Array.from({ length: count }, (_, i) => i).filter(
        (index) => !triedIndices.includes(index)
      );
      this.bang("No available threads", availableIndices.length > 0, triedIndices);

      // Randomly select an index from the available indices
      const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      try {
        const thread = locator.nth(randomIndex);
        await this.click(thread);
        return await func();
      } catch (e) {
        console.warn("Func is archived or removed.", e);
        triedIndices.push(randomIndex);
        await this.page.goBack();
      }
    }

    throw this.error(`Failed to find a thread with open comments after ${maxAttempts} attempts.`);
  }

  async findRandoSubreddit(visit = false) {
    const locator = this.page.getByTestId("search-community");
    await this.click(this.randoNth(locator, await locator.count()));
  }

  // Function to find a comment
  async findComment(nth = -1, random = Math.random() < 0.5) {
    const locator = this.page.locator("shreddit-comment");
    const comment = this.bang(
      "Comment not found",
      random && nth < 0 ? this.randoNth(locator, await locator.count()) : locator.nth(nth)
    );
    await comment.waitFor();
    return {
      post: await this.postTitleText(),
      text: await this.locatorTxtContent("div[slot='comment']", comment),
      locator: comment,
    };
  }

  // Function to add a comment to the main thread
  async addCommentToThread(comment: string) {
    // Wait for button to be visible and enabled
    await this.click(this.commentButton());

    // Continue with comment input
    await this.pressSequentially(this.page.locator("#subgrid-container").getByRole("textbox"), comment);

    // Submit comment
    await this.click(this.page.locator('button.button-primary[slot="submit-button"]'));
  }

  // Function to reply to a comment
  async replyToComment(locator: Locator, reply: string) {
    // Click the reply button
    const comment = locator.locator("shreddit-comment-action-row button").first();
    await this.click(comment);

    // Wait for the reply box to be visible
    const replyBox = locator.locator(
      "shreddit-comment-action-row shreddit-async-loader comment-composer-host faceplate-form shreddit-composer"
    );
    await replyBox.waitFor();
    await this.type(reply);

    // Click the submit button
    await this.click(replyBox.locator("button[slot='submit-button']").first());
  }

  // Function to check the member is joined the subreddit or not if not then join the subreddit.
  async checkAndJoinSubreddit() {
    // Click the "Join" button
    await this.click(
      this.bang(
        "'Join' button not found",
        this.page.getByRole("button", { name: "Join", exact: true }).first()
      )
    );
  }

  // visit the subreddit
  async visitSubredditCommunity() {
    // Click the "Join" button
    await this.click(
      this.bang("'visit' button not found", this.page.locator('span.avatar a[href^="/r/"]').first())
    );
  }

  // UpVote / DownVote
  async doVote() {
    await this.scrollabit();

    const ups = this.page.getByRole("button", { name: "Upvote" });
    const downs = this.page.getByRole("button", { name: "Downvote" });

    // Math.min(upCount, downCount) ensure we don't exceed the number of available votes
    const [upCount, downCount] = await Promise.all([ups.count(), downs.count()]);
    const length = rando(Math.min(upCount, downCount));

    // Using Array.from with just length
    for (let i = 0; i < length; i++) {
     if(rando()) await this.click(ups.nth(i));
     else await this.click(downs.nth(i));
    }
    [...Array(length)].map(
      async (_, i) => await (rando() ? this.click(ups.nth(i)) : this.click(downs.nth(i)))
    );
  }

  // Create Subreddit Post
  async createPostSubreddit(commentTitle: string, commentText: string) {
    await this.click(this.page.locator("#subgrid-container faceplate-tracker[noun=create_post]").first());
    await this.pressSequentially(this.page.locator("#innerTextArea").first(), commentTitle);

    // enter comment
    await this.page.keyboard.press("Tab");
    await this.page.keyboard.press("Tab");
    await this.type(commentText);

    // submit
    await this.page.keyboard.press("Tab");
    await this.page.keyboard.press("Tab");
    await this.page.keyboard.press("Enter");
  }
}

export default async function (page: Page, url?: string) {
  const reddit = new Reddit(page);
  await reddit.navigate(url || reddit.START_URL);
  return reddit;
}
