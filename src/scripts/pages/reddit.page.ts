import { Page, Locator } from "@playwright/test";
import { random } from "../../lib/utils.js";
import BasePage from "./base.page.js";

const data = {
  shortPauseTime: 750,
  mediumPauseTime: 1500,
  longPauseTime: 3000,
  megaLongPauseTime: 6000,
  defaultLoadTimeout: 1000 * 60,
};

const URL = "https://www.reddit.com/";
const SLEEP_RANDOM = 256;

export interface Options {
  search: string;
  comment1: string;
  comment2: string;
  reply_comment2: string;
  username: string;
  password: string;
}

export default class RedditPage extends BasePage {
  // LOCATORS
  readonly loginButton: Locator;
  readonly loginButtonOnModal: Locator;
  readonly commentAlertBanner: Locator;
  readonly xButton: Locator;
  readonly emailOrUsernameTextBox: Locator;
  readonly passwordTextBox: Locator;
  readonly userAgreement: Locator;
  readonly loginModal: Locator;
  readonly avatarIcon: Locator;
  readonly searchTextBox: Locator;
  readonly existingComments: Locator;
  readonly upVoteButton: Locator;
  readonly downVoteButton: Locator;
  readonly replyButton: Locator;
  readonly addCommentButton: Locator;
  readonly commentButton: Locator;
  readonly commentTextBox: Locator;
  readonly commentsData: Locator;
  readonly specificComment: (actualComment: string) => Locator;
  readonly userCommentSection: (author: string) => Locator;
  readonly actionToComment: (comment: string) => Locator;
  readonly actionBar: Locator;
  readonly actionBarNumberOfVotes: Locator;
  readonly replyTextBox: Locator;
  readonly replyCommentButton: Locator;

  constructor(readonly page: Page) {
    super(page);
    this.page.setDefaultTimeout(data.defaultLoadTimeout);
    //Login Page Locators
    this.loginButton = page.locator(`//a[@id='login-button']`);
    this.emailOrUsernameTextBox = page.locator(`//input[@id="login-username"]`);
    this.passwordTextBox = page.locator(`//input[@id="login-password"]`);
    this.avatarIcon = page.locator(`//button[@id='expand-user-drawer-button']`);
    this.loginButtonOnModal = page.getByRole("button", { name: "Log In" });
    this.commentAlertBanner = page.getByRole("banner", {
      name: "Take a break for 5 seconds before trying again.",
    });
    this.xButton = page.getByRole("button", { name: "close error button" });
    this.userAgreement = page.locator(`//a[contains(@href, 'user-agreement')]`);
    this.loginModal = page.locator(`#login`);
    //Home Page Locator
    this.avatarIcon = page.locator(`//button[@id='expand-user-drawer-button']`);
    this.searchTextBox = page.locator(`faceplate-search-input`).getByRole("textbox");
    this.addCommentButton = page.locator(`//faceplate-tracker[@noun='add_comment_button']`);
    this.commentButton = page.locator(`//button//span[@class='block relative']`);
    this.commentTextBox = page.locator(`//div[@name='body']`);
    this.existingComments = page.locator(`//shreddit-comment`);
    this.upVoteButton = this.page.getByRole("button", { name: "Upvote" });
    this.downVoteButton = this.page.getByRole("button", { name: "Downvote" });
    this.replyButton = this.page.getByRole("button", { name: "Reply" });
    this.commentsData = page.locator(`//div[@slot="comment"]`);
    //
    this.specificComment = (actualComment: string) =>
      this.commentsData.locator(`//p[contains(text(),'${actualComment}' )]`);
    this.userCommentSection = (author: string) => page.locator(`//shreddit-comment[@author='${author}']`);
    this.actionToComment = (comment: string) =>
      page.locator(`//text()[contains(.,'${comment}')]/ancestor::*[self::shreddit-comment]`); // To Search for Parent with child text Note: child->parent->child
    //
    this.actionBar = page.locator(`//shreddit-comment-action-row`);
    this.actionBarNumberOfVotes = page.locator(`shreddit-comment-action-row>>faceplate-number`); //To by pass shadow dom
    this.replyTextBox = page.locator(`//div[@role="textbox"][contains(@aria-placeholder, 'Reply to u')]`);
    this.replyCommentButton = page.locator(`//button//span[@class='block relative']`);
  }

  async goToRedditSite() {
    let maxIteration = 0;
    await this.page.goto(URL);
    await this.page.waitForLoadState("domcontentloaded");
    while ((await this.userAgreement.count()) === 0 && maxIteration < 5) {
      await this.page.waitForTimeout(data.mediumPauseTime);
      maxIteration++;
    }
  }

  async loginToReddit(email: string, password: string) {
    if (await this.loginButton.isVisible()) {
      let maxIteration = 0,
        maxIteration2 = 0;

      //Initial Login Button
      await this.loginButton.click();
      await this.page.waitForTimeout(data.longPauseTime);

      //Enter Email
      await this.emailOrUsernameTextBox.waitFor({ state: "visible" });
      await this.emailOrUsernameTextBox.fill(email);
      //Enter Password
      await this.passwordTextBox.waitFor({ state: "visible" });
      await this.passwordTextBox.fill(password);
      await this.page.keyboard.press("Tab");

      //Click on login button
      while ((await this.loginButtonOnModal.isEnabled()) && maxIteration < 5) {
        await this.page.waitForTimeout(data.mediumPauseTime);
        maxIteration++;
      }
      await this.loginButtonOnModal.isEnabled();
      await this.loginButtonOnModal.click();
      await this.page.waitForTimeout(data.longPauseTime);
      while ((await this.loginModal.isVisible()) && maxIteration2 < 5) {
        this.page.waitForTimeout(data.mediumPauseTime);
        maxIteration2++;
      }
      await this.page.waitForTimeout(5000);
    }
  }

  async searchAndOpenFirstTopic(searchText: string) {
    await this.loginModal.waitFor({ state: "hidden" }); //wait for log in popup to close
    //
    await this.searchTextBox.waitFor({ state: "visible" }); //wait for textbox to display
    await this.searchTextBox.click();
    await this.searchTextBox.fill(searchText);
    await this.searchTextBox.press("Enter");
    await this.page.waitForLoadState(`domcontentloaded`);
    await this.page.getByRole("button", { name: "Posts" }).click();
    await this.page.waitForLoadState(`domcontentloaded`);
    //
    // Randomly choose between tab navigation and direct link selection
    //
    const useTabNavigation = Math.random() < 0.5;
    if (useTabNavigation) {
      await this.page.getByRole("button", { name: "Posts" }).press("Tab");
      await this.page.getByRole("button", { name: "Relevance" }).press("Tab");
      await this.page.getByRole("button", { name: "All time" }).press("Tab");
      await this.page.getByRole("link", { name: "Skip to Navigation" }).press("Tab");
      await this.page.getByRole("link", { name: "Skip to Right Sidebar" }).press("Tab");
      // Original tab-based navigation
      const maxIteration = await random(1, 7 * 5);
      for (let i = 0; i < maxIteration; i++) {
        await this.page.waitForTimeout((await random(1, 5)) * SLEEP_RANDOM);
        await this.page.keyboard.press("Tab");
      }
      await this.page.keyboard.press("Enter");
    } else {
      // Direct link selection
      const searchResults = await this.page.getByRole("link").all();
      for (const result of searchResults) {
        const ariaLabel = await result.getAttribute("aria-label");
        if (ariaLabel && !ariaLabel.includes("icon r/")) {
          if (ariaLabel.includes("thumbnail") || ariaLabel.includes("title")) {
            await this.page.waitForTimeout((await random(1, 5)) * SLEEP_RANDOM);
            await result.click();
            break;
          }
        }
      }
    }

    await this.page.waitForLoadState(`domcontentloaded`);
  }

  async addCommentToMainThread(comment: string) {
    await this.page.waitForLoadState(`domcontentloaded`);

    // Wait for and locate the comment button
    const commentButton = this.page.getByRole("button", { name: "Add a comment" });

    // Wait for button to be visible and enabled
    await commentButton.waitFor({ state: "visible" });
    await commentButton.isEnabled(); // Wait until button is enabled
    await commentButton.click();

    // Continue with comment input
    const textbox = this.page.locator("#subgrid-container").getByRole("textbox");
    await textbox.waitFor({ state: "visible" });
    await textbox.click();
    await textbox.fill(comment);

    // Submit comment
    const submitButton = this.page.getByRole("button", { name: "Comment", exact: true });
    await submitButton.waitFor({ state: "visible" });
    await submitButton.click();
  }

  async upVoteComment(commentToUpvote: string) {
    var toBeAdded: number;
    await this.actionToComment(commentToUpvote).locator(this.upVoteButton).waitFor({ state: "visible" });
    //To check if Upvote is already pressed
    const upVotesIsPressed = await this.actionToComment(commentToUpvote)
      .locator(this.upVoteButton)
      .getAttribute("aria-pressed");
    //To check if Downvote is already pressed
    const downVotesIsPressed = await this.actionToComment(commentToUpvote)
      .locator(this.downVoteButton)
      .getAttribute("aria-pressed");
    // To Get Current Number of Comment Votes
    var currentNumberOfVotes = Number(
      await this.actionToComment(commentToUpvote).locator(this.actionBarNumberOfVotes).textContent()
    );

    if (downVotesIsPressed === "true") {
      toBeAdded = 2;
    } else {
      toBeAdded = 1;
    }
    //Perform the below codes if Upvote is not yet pressed
    if (upVotesIsPressed === "false") {
      await this.actionToComment(commentToUpvote).locator(this.upVoteButton).click();
      const newNumberOfVotes = currentNumberOfVotes + toBeAdded;
      //expect(newNumberOfVotes).toBeGreaterThan(currentNumberOfVotes) // Verify the count after upvote
      if (newNumberOfVotes < currentNumberOfVotes) {
        console.log("Upvote is not working");
      }
    }
  }

  async downVoteComment(commentToUpvote: string) {
    var toBeSubtracted: number;
    await this.actionToComment(commentToUpvote).locator(this.downVoteButton).waitFor({ state: "visible" });
    //To check if Upvote is already pressed
    const upVotesIsPressed = await this.actionToComment(commentToUpvote)
      .locator(this.upVoteButton)
      .getAttribute("aria-pressed");
    //To check if Downvote is already pressed
    const downVotesIsPressed = await this.actionToComment(commentToUpvote)
      .locator(this.downVoteButton)
      .getAttribute("aria-pressed");
    // To Get Current Number of Comment Votes
    var currentNumberOfVotes = Number(
      await this.actionToComment(commentToUpvote).locator(this.actionBarNumberOfVotes).textContent()
    );
    if (upVotesIsPressed === "true") {
      toBeSubtracted = 2;
    } else {
      toBeSubtracted = 1;
    }
    //Perform the below codes if Upvote is not yet pressed
    if (downVotesIsPressed === "false") {
      await this.actionToComment(commentToUpvote).locator(this.downVoteButton).click();
      const newNumberOfVotes = currentNumberOfVotes - toBeSubtracted;
      // expect(newNumberOfVotes).toBeLessThan(currentNumberOfVotes) // Verify the count of after downvote
      if (newNumberOfVotes > currentNumberOfVotes) {
        console.log("Down vote is not working");
      }
    }
  }

  async replyToComment(commentToReplyOn: string, reply: string) {
    await this.actionToComment(commentToReplyOn).locator(this.replyButton).waitFor({ state: "visible" });
    //To Click on reply button
    await this.actionToComment(commentToReplyOn).locator(this.replyButton).click();
    await this.replyTextBox.waitFor({ state: "visible" });
    await this.replyTextBox.fill(reply);
    await this.page.waitForTimeout(data.mediumPauseTime);
    await this.replyCommentButton.last().click();
    await this.specificComment(reply).waitFor({ state: "visible" });
    // await expect(this.specificComment(reply)).toBeVisible()
    await this.page.waitForTimeout(data.mediumPauseTime);
  }
  // Test Case flow
  // login to reddit
  // search for specific topic
  // open first topic
  // add a comment
  // add a second comment
  // upvote 1st comment
  // verifying the count of votes
  // downvote 2nd comment
  // verifying the count of votes
  //reply to 2nd comment
}
