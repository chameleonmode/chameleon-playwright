import { test as base } from "@playwright/test";
import { RedditPage } from "./page.js";

// Declare the types of your fixtures
type Fixtures = {
  redditPage: RedditPage;
};

export const addCommentToThread = base.extend<Fixtures>({
  redditPage: async ({ page }, use) => {
    // Create a Page instance
    const redditPage = new RedditPage(page);

    // Use the fixture in the test
    await use(redditPage);
  },
});