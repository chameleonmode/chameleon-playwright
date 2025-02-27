import { test as base } from "@playwright/test";
import { ExamplePage } from "./pages/example-page";

// Declare the types of your fixtures
type BddFixtures = {
  examplePage: ExamplePage;
};

// Extend basic test fixtures with BDD fixtures
export const test = base.extend<BddFixtures>({
  examplePage: async ({ page }, use) => {
    // Create a Page instance
    const examplePage = new ExamplePage(page);

    // Use the fixture in the test
    await use(examplePage);
  },
});

// Export all the rest of the fixtures
export { expect } from "@playwright/test";
