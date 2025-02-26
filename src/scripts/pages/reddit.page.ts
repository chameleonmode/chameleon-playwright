// src/scripts/pages/reddit.page.ts
import { Page, Locator } from "@playwright/test";
import { random, sleepRandom } from "../../lib/utils.js";
import Base from "./base.page.js";

export default class RedditPage extends Base {
  private readonly searchTextBox: Locator;
  private readonly threadLocator: Locator;
  private readonly commentButton: Locator;

  constructor(readonly page: Page) {
    super(page, "https://www.reddit.com/");

    // Create reusable locators
    this.searchTextBox = this.page.locator(`faceplate-search-input`).getByRole("textbox");
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

    await this.searchTextBox.waitFor({ state: "visible" }); //wait for textbox to display
    await this.searchTextBox.click();
    await this.searchTextBox.fill(text);
    await this.searchTextBox.press("Enter");
  }

  private async findByTabNavigation(threadElement: Locator) {
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
      await sleepRandom({}); // Wait a random amount of time
      if (maxIteration-- === 0 && !focusedIsThread()) {
        maxIteration++;
      }
    }

    await this.page.keyboard.press("Enter");
  }

  private async findByIndices(threadElement: Locator) {
    await threadElement.waitFor({ state: "visible" });
    await threadElement.scrollIntoViewIfNeeded();
    await sleepRandom({multiplier: 2});
    await threadElement.click({ force: true });
  }

  async findRandomThread(tabbed = Math.random() < 0.5): Promise<boolean> {

    let attempts = 0;
    const maxAttempts = 18;
    const triedIndices: number[] = [];

    while (attempts < maxAttempts) {
      console.debug(`Attempts remaining: ${maxAttempts - attempts}`);
      await this.waitForNavigation();
      await sleepRandom({ multiplier: 3 });

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
        // Click the "Posts" button and wait for navigation.
        await this.page.getByRole("button", { name: "Posts" }).click();
        await sleepRandom({ multiplier: 2 });

        // Choose the navigation method based on useTabbed
        if(tabbed) {
          await this.findByTabNavigation(threadElement);
        } else {
          await this.findByIndices(threadElement);
        }
        await this.waitForNavigation();
        // wait for the main post to load and check its comment count.
        const archived = await this.page.locator("div[slot='post-archived-banner']").isVisible();
        const removed = await this.page.locator("div[slot='post-removed-banner']").isVisible();
        if (!archived && !removed) {
          return true;
        }
        throw new Error("Post is archived or removed.");
      } catch (error) {
        console.warn(`Attempt ${attempts + 1} failed:`, error);
      }

      await this.page.goBack();
      await this.waitForNavigation();
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
