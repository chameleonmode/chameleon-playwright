// src/scripts/pages/reddit.page.ts
import { Page, Locator } from "@playwright/test";
import { random, sleepRandom } from "../../lib/utils.js";
import Base from "../pages/base.page.js";

export default class RedditPage extends Base {
  readonly searchTextBox: Locator;
  readonly threadLocator: Locator;

  constructor(readonly page: Page) {
    super(page, "https://www.reddit.com/");

    // Create reusable locators
    this.searchTextBox = page.locator(`faceplate-search-input`).getByRole("textbox");
    this.threadLocator = page.getByTestId('search-sdui-post');
  }

  async search(text: string) {
    await this.searchTextBox.waitFor(); 
    await this.searchTextBox.click();
    await this.searchTextBox.pressSequentially(text, { delay: random(50, 100) });
    await this.searchTextBox.press("Enter");
  }

  async findByTabNavigation(thread: Locator) {
    // Helper function that retrieves comparable properties from threadElement.
    const getThreadProps = async () => {
      return thread.evaluate((el) => ({
        tagName: el.tagName,
        ariaLabel: el.getAttribute("aria-label"),
      }));
    };

    // Check whether the currently focused element matches the threadElement.
    const focusedIsThread = async () => {
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
    
    let maxIteration = random(7, 50); // Number of tab presses to try
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

  async findByIndices(thread: Locator) {
    await thread.scrollIntoViewIfNeeded();
    await sleepRandom({ multiplier: 2 });
    await thread.click({ force: true });
  }
}
