// src/scripts/pages/reddit.page.ts
import { Page, Locator } from "@playwright/test";
import { random, sleepRandom } from "../../lib/utils.js";
import RedditPage from "./page.js";

export default class SeedPage extends RedditPage {
  constructor(readonly page: Page) {
    super(page);
  }

  async findRandomThread(tabbed = Math.random() < 0.5): Promise<boolean> {
    let attempts = 0;
    const maxAttempts = 18;
    const triedIndices: number[] = [];

    while (attempts < maxAttempts) {
      console.debug(`Attempts remaining: ${maxAttempts - attempts}`);
      await this.waitForNavigation();
      await sleepRandom({ multiplier: 3 });

      try {
        // Click the "Posts" button and wait for navigation.
        await this.page.getByRole("button", { name: "Posts" }).click();
        await sleepRandom({ multiplier: 2 });

      // Build a list of indices that haven't been tried
      const count = await this.threadLocator.count();
      const availableIndices = [...Array(count).keys()].filter((i) => !triedIndices.includes(i));
      const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      const threadElement = this.threadLocator.nth(randomIndex);
      await threadElement.waitFor();
      triedIndices.push(randomIndex);

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
}
