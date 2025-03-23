import { Page, Locator, expect } from "@playwright/test";
import Base from "../../lib/page.js";

class X extends Base {
  constructor(readonly page: Page) {
    super(page, "https://x.com");
  }

  // Locators
}

export default X;