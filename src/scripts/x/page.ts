import { Page, Locator, expect } from "@playwright/test";
import Base from "../page.js";

class X extends Base {
  constructor(readonly page: Page) {
    super(page, {
      start: { feature: "", url: "" },
      args: {},
      settings: {
        variations: 0,
        timeout: 0,
        wait: 0,
        max: 0
      }
    });
  }

  // Locators
}

export default X;
