import { Locator, Page, expect } from "@playwright/test";
import { sleepRandom } from "../../lib/utils.js";
import Base from "../../lib/page.js";

export class Reddit extends Base {
  constructor(readonly page: Page) {
    super(page, "https://www.reddit.com", "Reddit");
  }

  // Locators
  searchTextBox = () => this.page.locator(`faceplate-search-input`).getByRole("textbox");
  threadLocator = () => this.page.getByTestId("search-community");
  commentButton = () => this.page.getByRole("button", { name: "Add a comment" });
  commentReplyButton = () => this.page.locator('a[data-post-click-location="comments-button"]');
  commentLocator = () => this.page.locator("shreddit-comment");
  nextButton = () => this.page.getByRole("button", { name: "Next" });
  loginButton = () => this.page.locator("#login-button");
  postLocator = () => this.page.locator('main[id="main-content"] search-telemetry-tracker a[class="absolute inset-0"]');
  postTitleText = () => this.locatorTxtContent('h1[id^="post-title-"][slot="title"]');
  flairButton = () => this.randoNth(this.page.locator('div[name="flairId"]:not(.hidden) faceplate-radio-input[id^="post-flair-radio-input"]'));
  locator = (selector: string) => this.page.locator(selector);

  // get the text content of a locator
  locatorTxtContent = async (selector: string, locator?: Locator) => {
    const element = locator?.locator(selector).first() || this.page.locator(selector).first();
    await expect(element).toBeVisible();

    return this.bang(
      "Element not found in" + selector,
      await element.evaluate((ele) => ele?.textContent?.replace(/\s+/g, " ").trim())
    );
  };

  // Check authentication
  checkLoginAuthentication = async () =>
    this.bang("Login button not found", await this.loginButton().isVisible(), this.loginButton());

  // Login with credentials
  loginWithCredentials = async (email: string, password: string) => {
    await this.click(this.loginButton());

    const loginUserName = this.locator("faceplate-text-input#login-username input");
    await this.pressSequentially(loginUserName, email);

    const loginUserPassword = this.locator("faceplate-text-input#login-password input");
    await this.pressSequentially(loginUserPassword, password);

    const loginUserButton = this.page.getByRole("button", { name: "Log In" });
    await this.bang("Login submit button not found", loginUserButton.isVisible(), loginUserButton);
    await loginUserButton.click();
  };

  // Login google
  loginWithGoogle = async (email: string, password: string) => {
    await this.click(this.loginButton());

    const googleIframeSelector = 'iframe[title="Sign in with Google Button"]';
    const googleButton = this.locator(googleIframeSelector);
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
        await this.pressSequentially(emailInput, email);
        await googleLoginNextButton.click();

        const passwordInput = detailsPopup.locator('input[aria-label="Enter your password"]');
        await this.bang("Password input not found", passwordInput.isVisible(), passwordInput);
        await this.pressSequentially(passwordInput, password);

        const googleLoginPassNextButton = detailsPopup.locator("div#passwordNext button");
        await this.bang("Password next button not found", googleLoginPassNextButton.isVisible(), googleLoginPassNextButton);
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

  async findRandomThread() {
    await this.page.getByRole("button", { name: "Posts" }).click();

    const maxAttempts = 1;
    const triedIndices: number[] = [];
    for (let i = 0; i < maxAttempts; i++) {
      console.debug(`Attempts remaining: ${maxAttempts - i}`);
      await this.waitForNavigation();
      await sleepRandom();

      // Wait for thread elements to be available
      const threads = await this.threadLocator().count();
      this.bang("Thread not found", threads > 0, this.threadLocator());

      // Filter out indices we've already tried
      const availableIndices = Array.from({ length: threads }, (_, i) => i).filter(
        (index) => !triedIndices.includes(index)
      );

      // If we've tried all threads, throw an error
      this.bang("No available threads", availableIndices.length > 0, this.threadLocator());

      // Randomly select an index from the available indices
      const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];

      try {
        const thread = this.threadLocator().nth(randomIndex);
        await this.click(thread);
        return true;
      } catch (e) {
        console.warn("Func is archived or removed.", e);
        triedIndices.push(randomIndex);
        await this.page.goBack();
      }
    }
  }

  async findSubreddit() {
    await this.click(await this.randoNth(this.page.getByTestId("search-community")));
  }

  async addCommentToThread(comment: string) {
    // Wait for button to be visible and enabled
    await this.click(this.commentButton());

    // Continue with comment input
    await this.pressSequentially(this.page.locator("#subgrid-container").getByRole("textbox"), comment);

    // Submit comment
    await this.click(this.page.locator('button.button-primary[slot="submit-button"]'));
  }

  // Function to get a comment
  async getComment(nth = 2, random = Math.random() < 0.5) {
    await this.commentReplyButton().first().click();
    const comment = this.bang(
      "Comment not found",
      random ? await this.randoNth(this.commentLocator()) : this.commentLocator().nth(nth)
    );
    comment.scrollIntoViewIfNeeded();
    await comment.waitFor();
    return {
      text: await this.locatorTxtContent("div[slot='comment']", comment),
      locator: comment,
    };
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

  // UpVote / DownVote
  async doVote(vote = Math.random() < 0.5) {
    if (vote) await this.click(await this.randoNth(this.page.getByRole("button", { name: "Upvote" })));
    else await this.click(await this.randoNth(this.page.getByRole("button", { name: "Downvote" })));
  }

  // Create Subreddit Post  
  async createPostSubreddit(commentTitle: string, commentText: string) {
    await this.click(this.page.locator("#subgrid-container faceplate-tracker[noun=create_post]").first());
    await this.pressSequentially(this.page.locator("#innerTextArea").first(), commentTitle);
    await this.click(this.page.locator('r-post-flairs-modal#post-flair-modal'));
    const isAvailbleFlair = await this.page.locator('div[name="flairId"]:not(.hidden) faceplate-radio-input[id^="post-flair-radio-input"]').count();
    if (isAvailbleFlair) { await this.click(await this.flairButton()) }
    await this.click(this.page.locator('button#post-flair-modal-apply-button'));
    await this.pressSequentially(this.page.locator("shreddit-composer div[name=body]").first(), commentText);
    await this.click(this.page.locator("#inner-post-submit-button").first());
  }
}

export default async function (page: Page, url?: string) {
  const reddit = new Reddit(page);
  await reddit.navigate(url || reddit.START_URL);
  return reddit;
}
