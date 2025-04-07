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
    const element = locator?.locator(selector) || this.page.locator(selector);
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
    this.loginButton().click();

    const loginUserName = this.page.locator("faceplate-text-input#login-username input");
    await loginUserName.focus();
    await this.type(email);
    await loginUserName.press("Tab");

    const loginUserPassword = this.page.locator("faceplate-text-input#login-password input");
    await loginUserPassword.focus();

    await this.type(password);
    const loginUserButton = this.page.getByRole("button", { name: "Log In" });
    this.bang("Login submit button not found", loginUserButton.isVisible(), loginUserButton);
    loginUserButton.click();
  };

  // Login google
  loginWithGoogle = async (email: string, password: string) => {
    this.loginButton().click();

    const googleIframeSelector = 'iframe[title="Sign in with Google Button"]';
    const googleButton = this.page.locator(googleIframeSelector);
    this.bang("Google button not found", googleButton.isVisible(), googleButton);
    await googleButton.click();

    const detailsPopup = await this.page.waitForEvent("popup");
    await detailsPopup.waitForLoadState();
    const emailButtons = detailsPopup.locator("div[data-email]");

    if (await emailButtons.count() > 0) {
      await emailButtons.first().click();
    } else {
      const emailInput = detailsPopup.locator('input[aria-label="Email or phone"]');
      this.bang("Email input not found", emailInput.isVisible(), emailInput);
      
      let isEmailValueEmpty = await emailInput.inputValue();
      const googleLoginNextButton = detailsPopup.locator("div#identifierNext button");
      this.bang("Email next button not found", googleLoginNextButton.isVisible(), googleLoginNextButton);
    
      if (!isEmailValueEmpty) {
        await emailInput.type(email, { delay: random(50, 100) });
        await googleLoginNextButton.click();
    
        const passwordInput = detailsPopup.locator('input[aria-label="Enter your password"]');
        this.bang("Password input not found", passwordInput.isVisible(), passwordInput);
        await passwordInput.type(password, { delay: random(50, 100) });
    
        const googleLoginPassNextButton = detailsPopup.locator("div#passwordNext button");
        this.bang("Password next button not found", googleLoginPassNextButton.isVisible(), googleLoginPassNextButton);
        await googleLoginPassNextButton.click();
      } else {
        await googleLoginNextButton.click();
      }
    }
  };

  async search(text: string) {
    await this.searchTextBox().waitFor(); //wait for textbox to display
    await this.searchTextBox().click();
    await this.searchTextBox().pressSequentially(text, { delay: random(128, 256) });
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

  async addCommentToThread(comment: string) {
    // Wait for button to be visible and enabled
    await expect(this.commentButton()).toBeVisible();
    await expect(this.commentButton()).toBeEnabled();
    await this.commentButton().click();

    // Wait for comment input to be visible
    await this.page.waitForSelector('comment-composer-host[slot="ready"]');
    await expect(this.commentComposer()).toBeVisible();

    // Continue with comment input
    const textbox = this.page.locator("#subgrid-container").getByRole("textbox");
    await expect(textbox).toBeVisible();
    await textbox.click();
    await textbox.pressSequentially(comment, { delay: random(56, 128) });

    // Submit comment
    const submitButton = this.page.locator('button.button-primary[slot="submit-button"]');
    expect(submitButton).toBeVisible();
    await submitButton.click();
  }

  // Function to get a comment
  async getComment(nth = 0, random = Math.random() < 0.5) {
    const comment = this.bang(
      "Comment not found",
      random
        ? this.commentLocator().nth(Math.floor(Math.random() * (await this.commentLocator().count())))
        : this.commentLocator().nth(nth)
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
    locator.locator("shreddit-comment-action-row button").first().click();
    await sleepRandom({ multiplier: 2 });

    // Wait for the reply box to be visible
    const replyBox = locator.locator(
      "shreddit-comment-action-row shreddit-async-loader comment-composer-host faceplate-form shreddit-composer"
    );
    await replyBox.waitFor();

    await this.page.keyboard.type(reply);
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
  async doVote(vote: boolean) {
    try {
      const upVoteButton = this.upVoteButton();
      const downVoteButton = this.downVoteButton();

      if (vote) {
        const upVoteCount = await upVoteButton.count();
        if (upVoteCount > 0) {
          await upVoteButton.first().scrollIntoViewIfNeeded();
          const isVisible = await upVoteButton.first().isVisible();
          if (isVisible) {
            const isPressed = await upVoteButton.first().getAttribute("aria-pressed");

            if (isPressed !== "true") {
              await upVoteButton.first().scrollIntoViewIfNeeded();
              await upVoteButton.first().click();
              console.log("Upvote clicked");
            } else {
              await upVoteButton.first().scrollIntoViewIfNeeded();
              console.log("Upvote already done");
            }
          } else {
            console.log("Upvote button is not visible");
          }
        } else {
          console.log("No upvote button found");
        }
      } else {
        const downVoteCount = await downVoteButton.count();
        if (downVoteCount > 0) {
          const isVisible = await downVoteButton.first().isVisible();
          if (isVisible) {
            const isPressed = await downVoteButton.first().getAttribute("aria-pressed");
            if (isPressed !== "true") {
              await downVoteButton.first().scrollIntoViewIfNeeded();
              await downVoteButton.first().click();
              console.log("Downvote clicked");
            } else {
              await downVoteButton.first().scrollIntoViewIfNeeded();
              console.log("Downvote already done");
            }
          } else {
            console.log("Downvote button is not visible");
          }
        } else {
          console.log("No downvote button found");
        }
      }

      return true;
    } catch (error) {
      console.error("Error during voting:", error);
      return false;
    }
  }

  async findSubreddit(search: string) {
    const selector = "faceplate-tracker[noun=tab_communities]";
    await this.page.locator(selector).click();

    await this.waitForNavigation();

    const subRedditSearchOption = this.page.locator("search-telemetry-tracker a").first();
    const href = this.bang(
      "Subreddit search option not found",
      await this.page.locator("search-telemetry-tracker a").first().getAttribute("href")
    );
    const url = new URL(href);
    const searchTerm = url.searchParams.get("q");
    const decodedSearchTerm = searchTerm ? decodeURIComponent(searchTerm) : "";
    if (decodedSearchTerm.toLowerCase().trim() === search.toLowerCase().trim()) {
      console.log("Found Subreddit");
      subRedditSearchOption.click();
      await this.waitForNavigation();

      const postButton = this.page
        .locator("#subgrid-container faceplate-tracker[noun=create_post]")
        .first();
      await expect(postButton).toBeVisible();
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
