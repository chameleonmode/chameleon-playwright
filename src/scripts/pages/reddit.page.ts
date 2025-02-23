// src/scripts/pages/reddit.page.ts
// Page Object for Reddit
import { Page, Locator } from "@playwright/test";
import { random } from "../../lib/utils.js";
import BasePage from "./base.page.js";

export default class RedditPage extends BasePage {
  private readonly threadLocator: Locator;
  private readonly commentButton: Locator;

  constructor(readonly page: Page) {
    super(page, "https://www.reddit.com/");
    this.page.setDefaultNavigationTimeout(1000 * 60 * 2);
    this.page.setDefaultTimeout(1000 * 60 * 5);

    // Create reusable locators
    // this.threadLocator = page.locator("a[aria-label]").filter({
    //   has: page.locator('[aria-label*="thumbnail"], [aria-label*="title"]'),
    //   hasNot: page.locator('[aria-label*="icon r/"]'),
    // });
    this.threadLocator = page.locator("a[aria-label]").filter({
      hasNot: page.locator('[aria-label*="icon r/"]'),
    });

    this.commentButton = this.page.getByRole("button", { name: "Add a comment" });
  }

  /**
   * Search for a topic in the search box then select the "@param name" tab
   * @param text - The text to search for
   * @param name - The name of the tab to select
   */
  async search(text: string) {
    await this.waitForNavigation();

    const searchTextBox = this.page.locator(`faceplate-search-input`).getByRole("textbox");
    await searchTextBox.waitFor({ state: "visible" }); //wait for textbox to display
    await searchTextBox.click();
    await searchTextBox.fill(text);
    await searchTextBox.press("Enter");
  }

  private async findByTabNavigation(threadElement: Locator) {
    // Click the "Posts" button and wait for navigation.
    await this.page.getByRole("button", { name: "Posts" }).click();
    await this.waitForNavigation();

    // Helper function that retrieves comparable properties from threadElement.
    const getThreadProps = async () => {
      return threadElement.evaluate((el) => ({
        tagName: el.tagName,
        ariaLabel: el.getAttribute("aria-label"),
      }));
    };

    // Check whether the currently focused element matches the threadElement.
    const focusedIsThread = async (): Promise<boolean> => {
      // Get the properties of the focused element.
      const focusedProps = await this.getFocusedElement(); // { tagName, ariaLabel }
      // Get the properties of our target thread.
      const threadProps = await getThreadProps();
      // Compare the aria-labels (and ensure they meet our criteria).
      return (
        focusedProps.ariaLabel !== null &&
        focusedProps.ariaLabel === threadProps.ariaLabel &&
        !focusedProps.ariaLabel.includes("icon r/") &&
        (focusedProps.ariaLabel.includes("thumbnail") || focusedProps.ariaLabel.includes("title"))
      );
    };
    let maxIteration = await random(7, 50); // Number of tab presses to try
    // Loop until a thread element is focused or we've exhausted our tab presses
    while (maxIteration > 0) {
      await this.page.keyboard.press("Tab");
      await this.sleepRandom({}); // Wait a random amount of time
      if (maxIteration-- === 0 && !focusedIsThread()) {
        maxIteration++;
      }
    }

    await this.page.keyboard.press("Enter");
  }

  private async findByIndices(threadElement: Locator) {
    await threadElement.waitFor({ state: "visible" });
    await threadElement.scrollIntoViewIfNeeded();
    await this.sleepRandom({});
    await threadElement.click({ force: true });
    await this.waitForNavigation();
    await this.sleepRandom({});
  }

  async findRandomThread(tabbed = Math.random() < 0.5): Promise<boolean> {
    await this.waitForNavigation();

    let attempts = 0;
    const maxAttempts = 18;
    const triedIndices: number[] = [];

    while (attempts < maxAttempts) {
      console.debug(`Attempts remaining: ${maxAttempts - attempts}`);

      // Wait for thread elements to be available
      const count = await this.threadLocator.count();
      if (count === 0) {
        throw new Error("No eligible threads found");
      }

      // Build a list of indices that haven't been tried
      const availableIndices = [...Array(count).keys()].filter((i) => !triedIndices.includes(i));
      if (!availableIndices.length) {
        throw new Error("All threads have been attempted.");
      }

      const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      const threadElement = this.threadLocator.nth(randomIndex);
      triedIndices.push(randomIndex);
      try {
        // Choose the navigation method based on useTabbed
        if(tabbed) {
          await this.findByTabNavigation(threadElement);
        } else {
          await this.findByIndices(threadElement);
        }

        // wait for the main post to load and check its comment count.
        const post = this.page.locator("shreddit-post[comment-count]").first();
        await post.waitFor({ state: "visible" });
        const commentCountStr = await post.getAttribute("comment-count");
        const commentCount = commentCountStr ? parseInt(commentCountStr) : 0;
        if (commentCount > 0) {
          console.info("Thread with open comments found.");
          return true;
        }

        console.log("Comments are closed for this thread. Trying another result.");
        await this.sleepRandom({ multiplier: 2 });
        await this.page.goBack();
        await this.waitForNavigation();
      } catch (error) {
        console.warn(`Attempt ${attempts + 1} failed:`, error);
      }
      attempts++;
    }

    throw new Error(`Failed to find a thread with open comments after ${maxAttempts} attempts.`);
  }

  async addCommentToThread(comment: string) {
    await this.page.waitForLoadState(`domcontentloaded`);

    // Wait for button to be visible and enabled
    await this.commentButton.waitFor({ state: "visible" });
    await this.commentButton.isEnabled(); // Wait until button is enabled
    await this.commentButton.click();

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
}
