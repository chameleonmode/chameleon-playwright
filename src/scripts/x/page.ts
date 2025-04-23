import { Page, Locator, expect } from "@playwright/test";
import Base from "../page.js";
import configure from "../types.js";

class X extends Base {
  constructor(readonly page: Page) {
    super(page, configure({ start: { url: "https://x.com", feature: "x" } }));
  }

  // Locators
}

export default X;
