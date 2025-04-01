import { Page, expect } from "@playwright/test";
import { random, sleepRandom } from "../../lib/utils.js";
import Base from "../../lib/page.js";

class Reddit extends Base {
  constructor(readonly page: Page) {
    super(page, "https://www.reddit.com");
  }

  // Locators
  searchTextBox = () => this.page.locator(`faceplate-search-input`).getByRole("textbox");
  threadLocator = () => this.page.getByTestId("search-post-unit");
  commentButton = () => this.page.getByRole("button", { name: "Add a comment" });
  commentLocator = () => this.page.locator('shreddit-comment');
  commentActionRow = () => this.page.locator("shreddit-comment-action-row");
  commentComposer = () => this.page.locator('comment-composer-host');
  joinButton = () => this.page.locator('shreddit-join-button').first();
  emailField = () => this.page.locator('input[type="email"]');
  passwordField = () => this.page.locator('input[type="password"]');
  nextButton = () => this.page.getByRole("button", { name: "Next" });
  upVoteButton = () => this.page.locator('shreddit-post button[upvote]');
  downVoteButton = () => this.page.locator('shreddit-post button[downvote]');
  loginButton = () => this.page.locator('#login-button');

  PosttitleText = async () => {
    const selector = 'h1[id^="post-title-"][slot="title"]';
    await expect(this.page.locator(selector)).toBeVisible();
    // Use evaluate with a more sophisticated text extraction
    const title = await this.page.locator(selector).evaluate(el => {
      // Get the text directly, trim whitespace, and normalize spaces
      return el.textContent?.replace(/\s+/g, ' ').trim();
    });
    if (!title)
      throw new Error("Post title not found");
    return title;
  }

  // Check authentication  
  checkLoginAuthentication = async () => {
    try {
      const loginButton = this.loginButton();
      const isLoginBtn = await loginButton.isVisible();
      if (!isLoginBtn) {
        console.log('isAuthenticated : ', true);
      } else {
        console.log('isAuthenticated : ', false);
      }
      return isLoginBtn;
    } catch (error) {
      console.log('user can not logged in');
    }
  }

  // Login with credentials
  loginWithCredentials = async (email: string, password: string) => {
    console.log('login proccess started...');
    const loginButton = this.loginButton();
    await expect(loginButton).toBeVisible();
    loginButton.click();

    const loginUserName = this.page.locator("faceplate-text-input#login-username");
    loginUserName.click();

    const loginUserNameInput = loginUserName.locator("input");
    await loginUserNameInput.type(email, { delay: random(50, 100) });
    await loginUserNameInput.press('Tab');

    const loginUserPassword = this.page.locator("faceplate-text-input#login-password");
    loginUserPassword.click();

    const loginUserPasswordInput = loginUserPassword.locator("input");
    await loginUserPasswordInput.type(password, { delay: random(50, 100) });
    const loginUserButton = this.page.getByRole('button', { name: 'Log In' });

    await expect(loginUserButton).toBeVisible();
    loginUserButton.click();
    return true;
  }

  // Login google
  loginWithGoogle = async (email: string, password: string) => {
    console.log('login proccess started...');
    const loginButton = this.loginButton();
    await expect(loginButton).toBeVisible();
    loginButton.click();

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
        await emailInput.type(email, { delay: random(50, 100) });
        await googleLoginNextButton.click();

        const passwordInput = popupDetailFilleds.getByLabel("Enter your password");
        await passwordInput.waitFor({ state: 'visible' });
        await passwordInput.type(password, { delay: random(50, 100) });

        const googleLoginPassNextButton = popupDetailFilleds.locator('div#passwordNext button');
        await googleLoginPassNextButton.waitFor({ state: 'visible' });
        await googleLoginPassNextButton.click();
      } else {
        await googleLoginNextButton.click();
      }
    }
  }

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
      const count = await this.threadLocator().count();
      const availableIndices = [...Array(count).keys()].filter((i) => !triedIndices.includes(i));
      const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      triedIndices.push(randomIndex);

      const thread = this.threadLocator().nth(randomIndex);
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

    throw new Error(`Failed to find a thread with open comments after ${maxAttempts} attempts.`);
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

  // New methods from reply-comment.ts
  async getFirstCommentText(): Promise<string | null> {
    await this.commentLocator().first().waitFor();
    return await this.commentLocator().first().evaluate(el => {
      const content = el.querySelector("div[slot='comment']");
      return content ? content.textContent?.trim() || null : null;
    });
  }

  async replyToFirstComment(replyMessage: string): Promise<boolean> {
    try {
      const firstComment = this.commentLocator().first();
      await firstComment.waitFor();

      const replyButton = firstComment.locator("shreddit-comment-action-row button").first();
      await replyButton.click();

      await this.page.waitForTimeout(1000);

      const replyBox = firstComment.locator("shreddit-comment-action-row shreddit-async-loader comment-composer-host faceplate-form shreddit-composer");
      await replyBox.waitFor();

      await this.page.keyboard.type(replyMessage);
      const submitButton = replyBox.locator("button[slot='submit-button']");
      await submitButton.click();

      return true;
    } catch (error) {
      console.error("Error replying to comment:", error);
      return false;
    }
  }

  async findCommentWithTriggers(
    triggerWord: string,
    caseSensitive: boolean = false
  ): Promise<any> {
    try {
      console.log("Searching for comments with triggerword:", triggerWord);
      await this.commentLocator().first().waitFor();

      const allComments = await this.commentLocator().all();

      for (const comment of allComments) {
        const commentText = await comment.evaluate(el => {
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

  async replyToSearchComment(elemElem: any, reply: string) {
    try {
      // const replyContainer = await commentHandler.evaluateHandle((elems, commentElemIndex) => {
      //   const elem = elems[commentElemIndex];
      const replyContainer = await elemElem.evaluateHandle((elem: any) => {
        const commentActionsParent = elem.querySelector("shreddit-comment-action-row");
        const replyButton = commentActionsParent.querySelector("button");

        replyButton.click();

        const replyCommentWrapper = elem.querySelector("shreddit-comment-action-row shreddit-async-loader");

        const replyContainerWrapper = replyCommentWrapper.querySelector("comment-composer-host faceplate-form shreddit-composer");

        if (replyContainerWrapper) {
          return replyContainerWrapper
        } else {
          return false;
        }
      });


      if (replyContainer) {

        // const maxLength = 50;
        // if (reply.length > maxLength) {
        //   console.warn(`Reply is too long, truncating to ${maxLength} characters.`);
        //   reply = reply.slice(0, maxLength);
        // }

        await this.page.waitForTimeout(1000);
        await this.page.keyboard.type(reply);
        await replyContainer.evaluate((elem: any) => {
          const submitButton = elem.querySelector("button[slot='submit-button']");
          if (submitButton) {
            submitButton.click();
          }
        });

        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }


  // Function to check the member is joined the subreddit or not if not then join the subreddit.
  async checkAndJoinSubreddit(): Promise<boolean> {
    try{
      if (await this.joinButton().count() === 0) {
        console.log("No 'Join' button found on the page.");
        return false;
      }
  
      const parentElement = this.joinButton().locator('..');
      if (await parentElement.count() === 0) {
        console.log("Parent element of the 'Join' button not found.");
        return false;
      }
  
      const joinStatusAttribute = await parentElement.evaluate(el => el.getAttribute("noun"));
      if (joinStatusAttribute && joinStatusAttribute.toLowerCase().includes("unsubscribe")) {
        console.log("User is already a member of the subreddit.");
        return true;
      }
  
      console.log("User is not a member of the subreddit. Joining now...");
      const shadowRootHandle = await this.joinButton().evaluateHandle(el => el.shadowRoot);
      const joined = await shadowRootHandle.evaluate((shadowRoot: ShadowRoot) => {
        const button = shadowRoot.querySelector<HTMLElement>('.button');
        if (!button) return false;
        button.click();
        return true;
      });
  
      if (!joined) {
        console.log("Failed to join the subreddit.");
        return false;
      }
  
      console.log("Successfully joined the subreddit.");
      return true;
    }
    catch (error) {
      console.error("Error during voting:", error);
      return false;
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


  async findSubreddit(search: string): Promise<boolean> {

    const selector = "faceplate-tracker[noun=tab_communities]";
    await this.page.locator(selector).click();

    await this.waitForNavigation();

    const subRedditSearchOption = this.page.locator("search-telemetry-tracker a").first();
    const href = await this.page.locator("search-telemetry-tracker a").first().getAttribute("href");
    if (href) {
      try {
        const url = new URL(href);
        const searchTerm = url.searchParams.get('q');
        const decodedSearchTerm = searchTerm ? decodeURIComponent(searchTerm) : "";
        if (decodedSearchTerm.toLowerCase().trim() === search.toLowerCase().trim()) {
          console.log("Found Subreddit");
          subRedditSearchOption.click();
          await this.waitForNavigation();

          const postButton = this.page.locator("#subgrid-container faceplate-tracker[noun=create_post]").first();
          await expect(postButton).toBeVisible();
          return true;
        }
      } catch (error) {
        return false;
      }
    } else {
      console.log("URL not found.");
      return false;
    }
    return false
  }

  // Create Subreddit Post
  async createPostSubreddit(commentTitle: string, commentText: string): Promise<boolean> {
    try {
      const postButton = this.page.locator("#subgrid-container faceplate-tracker[noun=create_post]").first();
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

      const buttonLocator = this.page.locator('#inner-post-submit-button');
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

export default Reddit;