import { test as base } from '@playwright/test';

export let config = {
  cdpPort: 0
};

export const baseTest = base.extend({
  browser: async ({ playwright }, use, testInfo) => {
    const cdpPort = config.cdpPort;
    const browser = await playwright.chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`);
    await use(browser);
    await browser.close();
  },
  context: async ({ browser }, use) => {
    const context = browser.contexts()[0];
    await use(context);
  },
  page: async ({ context }, use) => {
    const page = context.pages()[0];
    await use(page);
  },
});

export { expect, test } from '@playwright/test';