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
  joinButtonclick = () => this.page.locator('button[data-post-click-location="join"]'); 
  emailField = () => this.page.locator('input[type="email"]');
  passwordField = () => this.page.locator('input[type="password"]');
  nextButton = () => this.page.getByRole("button", { name: "Next" });
  upVoteButton = () => this.page.locator("shreddit-post button[upvote]");
  downVoteButton = () => this.page.locator("shreddit-post button[downvote]");
  loginButton = () => this.page.locator("#login-button");
  postLocator() {
    return this.page.locator('main[id="main-content"] search-telemetry-tracker a[class="absolute inset-0"]');
  }

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
    // Use bang to ensure the search text box exists
    await this.bang("Search text box not found",this.searchTextBox().isVisible(),this.searchTextBox());
    await this.searchTextBox().click();
    await this.searchTextBox().pressSequentially(text, { delay: random(128, 256) });
    await this.searchTextBox().press("Enter");
    await sleepRandom({ multiplier: 6 });
  }

  
// Function to click on a post from the main feed
async clickPost(nth = 2, random = Math.random() < 0.5) {
  const communitiesButton = await this.page.locator('a[slot="communities"] span[class="flex justify-center"]').getByText('Communities');
  await this.bang("Search text box not found",communitiesButton.isVisible(),communitiesButton);
  communitiesButton.click();
  await sleepRandom({ multiplier: 6 });
  const post = await this.bang(
    "Post not found",
    random ? this.postLocator().nth(Math.floor(Math.random() * (await this.postLocator().count())))
           : this.postLocator().nth(nth)
  );
  await post.click();
  return post;
}


// Function to check if member is joined to subreddit, if not join it
async checkAndJoinSubreddit(): Promise<boolean> {
  await sleepRandom({ multiplier: 6 });

  // 1. Safely locate and verify join button exists
  const joinButton = this.bang("Join button not found", this.joinButton());
  await this.bang("Join button not visible", joinButton.isVisible(), joinButton);

  // 2. Check parent element (optional)
  const parentElement = joinButton.locator("..");
  await this.bang("Parent element not found", parentElement.isVisible(), parentElement);
  // 3. Get the actual join button element
  const joinButtonElement = this.page.locator('button[data-post-click-location="join"]').first();
  await this.bang("Join button not visible", joinButtonElement.isVisible(), joinButtonElement);

  // 4. Check if already joined
  const buttonText = await joinButtonElement.textContent();
  if (buttonText?.toLowerCase().includes('joined')) {
    console.log("User is already a member of the subreddit.");
    return true;
  }

  // 5. Join the subreddit
  console.log("User is not a member of the subreddit. Joining now...");
  this.bang("Failed to click join button",  joinButtonElement.isVisible(), joinButtonElement);
  await joinButtonElement.click();
  // 6. Confirm joined status using bang
  const joinedIndicator = this.page.locator('button[data-post-click-location="join"]')
    .getByText('joined', { exact: true });
  await this.bang("Failed to join subreddit", joinedIndicator.isVisible(), joinedIndicator);

  console.log("Successfully joined the subreddit.");
  return true;
}


async findRandomThread(): Promise<boolean> {
  const maxAttempts = 18;
  
  for (let i = 0; i < maxAttempts; i++) {
    console.debug(`Attempts remaining: ${maxAttempts - i}`);
    await this.waitForNavigation();
    
    // Get all available threads
    const threads = await this.threadLocator().all();
    const randomThread = threads[Math.floor(Math.random() * threads.length)];
    
    await randomThread.scrollIntoViewIfNeeded();
    await this.bang("Failed to click thread", randomThread.click({ force: true }));
    
    // Check if comment button exists and is visible
    const commentButton = this.commentButton();
    await this.bang("Comment button not found/visible (post may be archived)", 
                   commentButton.isVisible(), 
                   commentButton);
    
    return true;
  }
  
  throw this.error(`Failed to find an open thread after ${maxAttempts} attempts.`);
}

// Function to get a comment
async getComment(nth = 3, random = Math.random() < 0.5) {
  const comment = this.bang(
    "Comment not found",
    random
      ? this.commentLocator().nth(Math.floor(Math.random() * (await this.commentLocator().count())))
      : this.commentLocator().nth(nth)
  );

  // Use a more specific selector to avoid nested matches
  const commentContent = comment.locator("> div[slot='comment']").first();
  return {
    text: await commentContent.innerText(),
    locator: comment,
  };
}

// Function to reply to a comment
async replyToComment(locator: Locator, reply: string) {
  await sleepRandom({ multiplier: 6 });

  // Click the reply button
  locator.locator("shreddit-comment-action-row button").first().click();
  await sleepRandom({ multiplier: 6 });

  // Wait for the reply box to be visible
  const replyBox = locator.locator(
    "shreddit-comment-action-row shreddit-async-loader comment-composer-host faceplate-form shreddit-composer"
  );

  await this.page.keyboard.type(reply);
  await replyBox.locator("button[slot='submit-button']").click();
  console.log("Commented");
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

 

  // UpVote / DownVote
  async voteOnPost(vote: boolean): Promise<boolean> {
    const direction = vote ? "Upvote" : "Downvote";
    const voteButtonLocator = vote ? this.upVoteButton() : this.downVoteButton();
    await this.bang(`No ${direction.toLowerCase()} button found`, voteButtonLocator.isVisible(), voteButtonLocator);
    const voteButton = voteButtonLocator.first();
    await voteButton.scrollIntoViewIfNeeded();

    const isPressed = await voteButton.getAttribute("aria-pressed");
    const isAlreadyPressed = isPressed?.toLowerCase() === "true";

    if (!isAlreadyPressed) {
      await voteButton.click();
      console.log(`${direction} clicked`);
    } else {
      console.log(`${direction} already done`);
    }
    return true;
  }

  async findSubreddit(search: string) {
    const selector = 'a[id = "search-results-page-tab-communities"]';
    await this.page.locator(selector).click();
    await this.waitForNavigation();
    await sleepRandom({ multiplier: 5 });

    const subRedditSearchOption = this.page.locator("search-telemetry-tracker a").first();
    this.bang("Subreddit search option not found", await subRedditSearchOption.isVisible(), subRedditSearchOption);
    const unParsedhref = await subRedditSearchOption.getAttribute("href");

    if (unParsedhref) {
      const href = unParsedhref;
      const match = href.match(/\/r\/([^\/]+)\/?/) || "";
      this.bang(`${search} subreddit not found`, `r/${match[1]}`.toLowerCase().trim() === search.toLowerCase().trim(), href);
      const subredditPath = `r/${match[1]}`;

      if (subredditPath.toLowerCase().trim() === search.toLowerCase().trim()) {
        console.log("Found Subreddit");
        await subRedditSearchOption.click();
      }
    }
  }

  // Create Subreddit Post
  async createPostSubreddit(commentTitle: string, commentText: string) {
    await this.waitForNavigation();
    const postButton = this.page.locator("section create-post-entry-point-wrapper faceplate-tracker a[data-testid='create-post']");
    await postButton.waitFor({ state: "visible" });
    this.bang("Create Post button not visible", await postButton.isVisible(), postButton);
    await postButton.click();

    const titleElem = this.page.locator("#innerTextArea").first();
    await sleepRandom({ multiplier: 5 });
    this.bang("Title input not visible", await titleElem.isVisible(), titleElem);
    await titleElem.click();
    await this.type(commentTitle)

    const flairBtn = this.page.locator('r-post-flairs-modal#post-flair-modal');
    this.bang("Flair add Button not visible", await flairBtn.isVisible(), flairBtn);
    await flairBtn.click();

    const flairRadioBtn = this.page.locator('faceplate-radio-input#post-flair-radio-input-0');
    this.bang("Flair radio Button not visible", await flairRadioBtn.isVisible(), flairRadioBtn);
    await flairRadioBtn.click();

    const addFlairBtn = this.page.locator('button#post-flair-modal-apply-button')
    this.bang("Add flair Button not visible", await addFlairBtn.isVisible(), addFlairBtn);
    await addFlairBtn.click();

    const bodyElem = this.page.locator("shreddit-composer div[name=body]").first();

    this.bang("Body input not visible", await bodyElem.isVisible(), bodyElem);
    await bodyElem.click();
    await this.type(commentText);

    const submitButton = this.page.locator("#inner-post-submit-button").first();
    this.bang("Submit button not visible", await submitButton.isVisible(), submitButton);

    await submitButton.click();
    console.log("Post submitted");
    return true;
  }
}

export default async function (page: Page, url?: string) {
  const reddit = new Reddit(page);
  await reddit.navigate(url || reddit.START_URL);
  return reddit;
}
