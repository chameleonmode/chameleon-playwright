import { Locator, Page, expect } from "@playwright/test";
import { random, sleepRandom } from "../../lib/utils.js";
import Base from "../../lib/page.js";

export class Reddit extends Base {
  constructor(readonly page: Page) {
    super(page, "https://www.reddit.com", "Reddit");
  }

  // Locators
  searchTextBox = () => this.page.locator(`faceplate-search-input`).getByRole("textbox");
  threadLocator = () => this.page.getByTestId("search-post-unit");
  subredditLocator = () => this.page.getByTestId("search-community");
  commentButton = () => this.page.getByRole("button", { name: "Add a comment" });
  commentLocator = () => this.page.locator("shreddit-comment");
  commentActionRow = () => this.page.locator("shreddit-comment-action-row");
  commentComposer = () => this.page.locator("comment-composer-host");
  joinButton = () => this.page.locator("shreddit-join-button").first();
  emailField = () => this.page.locator('input[type="email"]');
  passwordField = () => this.page.locator('input[type="password"]');
  nextButton = () => this.page.getByRole("button", { name: "Next" });
  upVoteButton = () => this.page.locator("shreddit-post button[upvote]");
  downVoteButton = () => this.page.locator("shreddit-post button[downvote]");
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

  async findRandomThread(): Promise<boolean> {
    await this.page.getByRole("button", { name: "Posts" }).click();

    const maxAttempts = 18;
    const triedIndices: number[] = [];
    for (let i = 0; i < maxAttempts; i++) {
      console.debug(`Attempts remaining: ${maxAttempts - i}`);
      await this.waitForNavigation();
      await sleepRandom({ multiplier: 3 });

      // Wait for thread elements to be available
      const availableIndices = [...Array(await this.threadLocator().count()).keys()].filter(
        (i) => !triedIndices.includes(i)
      );
      triedIndices.push(availableIndices[Math.floor(Math.random() * availableIndices.length)]);

      const thread = this.threadLocator().nth(triedIndices.at(-1) ?? 0);
      await thread.scrollIntoViewIfNeeded();
      await sleepRandom({ multiplier: 2 });

      await thread.click({ force: true });
      await this.waitForNavigation();
      await sleepRandom({ multiplier: 3 });
      try {
        await expect(this.commentButton()).toBeVisible({ timeout: 5000 });
        return true;
      } catch (e) {
        console.warn("Post is archived or removed.");
        await this.page.goBack();
      }
    }

    throw this.error(`Failed to find a thread with open comments after ${maxAttempts} attempts.`);
  }

  async findSubreddit() {
    const tab = await this.randoNth(this.page.getByTestId("search-community"));
    await this.click(tab);

    const subreddit = await this.randoNth(this.subredditLocator());
    await this.click(subreddit);
  }

  async addCommentToThread(comment: string) {
    // Wait for button to be visible and enabled
    await this.click(this.commentButton());

    // Wait for comment input to be visible
    await this.page.waitForSelector('comment-composer-host[slot="ready"]');
    await expect(this.commentComposer()).toBeVisible();

    // Continue with comment input
    const textbox = this.page.locator("#subgrid-container").getByRole("textbox");
    await this.pressSequentially(textbox, comment);

    // Submit comment
    const submitButton = this.page.locator('button.button-primary[slot="submit-button"]');
    await this.click(submitButton);
  }

  // Function to get a comment
  async getComment(nth = 0, random = Math.random() < 0.5) {
    const comment = this.bang(
      "Comment not found",
      random ? await this.randoNth(this.commentLocator()) : this.commentLocator().nth(nth)
    );
    return {
      text: await this.locatorTxtContent("div[slot='comment']", comment),
      locator: comment,
    };
  }

  // Function to reply to a comment
  async replyToComment(locator: Locator, reply: string) {
    await locator.waitFor();

    // Click the reply button
    // locator.locator("shreddit-comment-action-row button").first().click();
    const comment = locator.locator("shreddit-comment-action-row button").first();
    await comment.scrollIntoViewIfNeeded();
    await sleepRandom();
    await comment.click();
    await sleepRandom();

    // Wait for the reply box to be visible
    const replyBox = locator.locator(
      "shreddit-comment-action-row shreddit-async-loader comment-composer-host faceplate-form shreddit-composer"
    );
    await replyBox.waitFor();
    await this.type(reply);
    await sleepRandom();

    // Click the submit button
    await replyBox.locator("button[slot='submit-button']").click();
  }

  // Function to find a comment with a specific trigger word
  async findCommentWithTriggers(triggerWord: string, caseSensitive = false) {
    // stop using any in typescript either add propper typing : Promise<boolean | { elem: Locator; comment: string }> or dont specify at all
    try {
      console.log("Searching for comments with triggerword:", triggerWord);
      await this.commentLocator().first().waitFor();

      const allComments = await this.commentLocator().all();

      for (const comment of allComments) {
        const commentText = await comment.evaluate((el) => {
          const content = el.querySelector("div[slot='comment']");
          return content ? content.textContent?.trim() || null : null;
        });

        if (!commentText) continue;

        if (triggerWord.length === 0) {
          return false;
        }
        const compareText = caseSensitive ? commentText : commentText.toLowerCase();
        const compareTrigger = triggerWord.toLowerCase();
        const matchedTrigger = compareText.includes(compareTrigger);

        if (matchedTrigger) {
          return { elem: comment, comment: commentText };
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  // Function to reply to a comment
  async replyToSearchComment(locator: Locator, reply: string) {
    // stop using any in typescript
    // const replyContainer = await commentHandler.evaluateHandle((elems, commentElemIndex) => {
    //   const elem = elems[commentElemIndex];
    const replyContainer = await locator.evaluateHandle((elem) => {
      elem.querySelector("shreddit-comment-action-row")?.querySelector("button")?.click();
      return elem
        .querySelector("shreddit-comment-action-row shreddit-async-loader")
        ?.querySelector("comment-composer-host faceplate-form shreddit-composer");
    });

    // const maxLength = 50;
    // if (reply.length > maxLength) {
    //   console.warn(`Reply is too long, truncating to ${maxLength} characters.`);
    //   reply = reply.slice(0, maxLength);
    // }

    await this.page.waitForTimeout(1000);
    await this.page.keyboard.type(reply);
    await replyContainer.evaluate((elem) => {
      if (!elem) throw new Error("Reply container not found");
      const submitButton = elem.querySelector<HTMLElement>("button[slot='submit-button']");
      if (submitButton) {
        submitButton.click();
      }

      throw new Error("Submit button not found");
    });
  }

  // Function to check the member is joined the subreddit or not if not then join the subreddit.
  async checkAndJoinSubreddit() {
    if ((await this.joinButton().count()) === 0) {
      console.log("No 'Join' button found on the page.");
      return false;
    }

    const parentElement = this.joinButton().locator("..");
    if ((await parentElement.count()) === 0) {
      console.log("Parent element of the 'Join' button not found.");
      return false;
    }

    const joinStatusAttribute = await parentElement.evaluate((el) => el.getAttribute("noun"));
    if (joinStatusAttribute && joinStatusAttribute.toLowerCase().includes("unsubscribe")) {
      console.log("User is already a member of the subreddit.");
      return true;
    }

    console.log("User is not a member of the subreddit. Joining now...");
    const shadowRootHandle = await this.joinButton().evaluateHandle((el) => el.shadowRoot);
    const joined = await shadowRootHandle.evaluate((shadowRoot: ShadowRoot) => {
      const button = shadowRoot.querySelector<HTMLElement>(".button");
      if (!button) return false;
      button.click();
      return true;
    });

    if (!joined) {
      throw new Error("Failed to join the subreddit.");
    }
  }

  // UpVote / DownVote
  async doVote(vote = Math.random() < 0.5) {
    if (vote) {
      const upvoteButton = await this.randoNth(this.page.getByRole("button", { name: "Upvote" }));
      await this.click(upvoteButton);
    } else {
      const downVoteButton = await this.randoNth(this.page.getByRole("button", { name: "Downvote" }));
      await this.click(downVoteButton);
    }
  }

  // Create Subreddit Post
  async createPostSubreddit(commentTitle: string, commentText: string) {
    try {
      const postButton = this.page
        .locator("#subgrid-container faceplate-tracker[noun=create_post]")
        .first();
      await postButton.click();
      console.log("Create Post button clicked");

      const titleElem = this.page.locator("#innerTextArea").first();
      const bodyElem = this.page.locator("shreddit-composer div[name=body]").first();

      await titleElem.click();
      await titleElem.pressSequentially(commentTitle, { delay: random(56, 128) });
      await this.page.keyboard.press("Tab");
      await this.page.keyboard.press("Tab");
      await this.page.keyboard.press("Enter");
      await this.page.keyboard.type(commentText, { delay: random(56, 128) });

      const buttonLocator = this.page.locator("#inner-post-submit-button");
      const buttonCount = await buttonLocator.count();

      if (buttonCount > 0) {
        await buttonLocator.first().click();
        console.log("Post submitted");
        return true;
      } else {
        console.error("Submit button not found");
        return false;
      }
    } catch (error) {
      console.error("Error in createPostSubreddit:", error);
      return false;
    }
  }
}

export default async function (page: Page, url?: string) {
  const reddit = new Reddit(page);
  await reddit.navigate(url || reddit.START_URL);
  return reddit;
}
