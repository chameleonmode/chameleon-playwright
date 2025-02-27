import { Page, Locator, expect } from "@playwright/test";
import { random, sleepRandom } from "../../lib/utils.js";
import { Base } from "../pages/base.page.js";

export class RedditPage extends Base {
  constructor(readonly page: Page) {
    super(page, "https://www.reddit.com");
  }

  // Locators
  searchTextBox = () => this.page.locator(`faceplate-search-input`).getByRole("textbox");
  searchTelemetryTracker = () => this.page.getByTestId(" search-sdui-post"); // <search-telemetry-tracker
  threadLocator = () => this.page.getByTestId("search-post-unit"); // <div
  threadLocatorsHref = (thread: Locator) => thread.getByTestId("post-title"); // <a
  focusedIsPost = async (thread: Locator) => {
    // Get the properties of the focused element.
    const focusedProps = await this.getFocusedElement(); // { tagName, ariaLabel }

    // Get the properties of our target thread.
    const threadProps = this.threadLocatorsHref(thread).evaluate((el) => ({
      tagName: el.tagName,
      ariaLabel: el.getAttribute("aria-label"),
    }));

    // Compare the aria-labels (and ensure they meet our criteria).
    return focusedProps.tagName === "A" && focusedProps.ariaLabel !== null && focusedProps !== undefined;
  };
  firstPost = () => this.page.locator("shreddit-post").first();
  commentButton = () => this.page.getByRole("button", { name: "Add a comment" });
  addCommentButton = () => this.page.getByTestId("trigger-button");

  async search(text: string) {
    await this.searchTextBox().waitFor(); //wait for textbox to display
    await this.searchTextBox().click();
    await this.searchTextBox().pressSequentially(text, { delay: random(128, 256) });
    await this.searchTextBox().press("Enter");
  }

  async findByTabNavigation(thread: Locator) {
    let maxIteration = random(7, 50); // Number of tab presses to try
    // Loop until a thread element is focused or we've exhausted our tab presses
    while (maxIteration > 0) {
      await this.page.keyboard.press("Tab");
      await sleepRandom(); // Wait a random amount of time
      if (maxIteration-- === 0 && !this.focusedIsPost(thread)) {
        maxIteration++;
      }
    }

    await this.page.keyboard.press("Enter");
  }

  async findByIndices(thread: Locator) {
    await thread.scrollIntoViewIfNeeded();
    await sleepRandom({ multiplier: 2 });
    await thread.click({ force: true });
  }

  async findRandomThread(tabbed = Math.random() < 0.5): Promise<boolean> {
    await this.page.getByRole("button", { name: "Posts" }).click();

    const maxAttempts = 18;
    const triedIndices: number[] = [];

    let attempts = 0;
    for (let i = 0; i < maxAttempts; i++) {
      console.debug(`Attempts remaining: ${maxAttempts - attempts}`);
      await this.waitForNavigation();
      await sleepRandom({ multiplier: 3 });

      // Wait for thread elements to be available
      const count = await this.threadLocator().count();
      const availableIndices = [...Array(count).keys()].filter((i) => !triedIndices.includes(i));
      const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      const threadElement = this.threadLocator().nth(randomIndex);
      triedIndices.push(randomIndex);

      await this.findByIndices(threadElement);
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
    const commentComposer = this.page.locator('comment-composer-host');
    // Continue with comment input
    const textbox = this.page.locator("#subgrid-container").getByRole("textbox");
    await expect(commentComposer).toBeVisible();
    await commentComposer.click();
    await commentComposer.pressSequentially(comment, { delay: random(56, 128) });

    // Submit comment
    // vanilla
    const submitButton = this.page.getByRole("button", { name: "Comment", exact: true });
    // By text and slot attribute
    const commentSubmitButton = this.page.locator('button[slot="submit-button"]:has(:text("Comment"))');
    // More specific with additional classes
    const commentSubmitButtonDetailed = this.page.locator('button.button-primary[slot="submit-button"]');

    expect(commentSubmitButtonDetailed).toBeVisible();
    await commentSubmitButtonDetailed.click();
  }
}
