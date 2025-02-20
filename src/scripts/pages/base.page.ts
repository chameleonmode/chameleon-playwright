import { Page } from "@playwright/test";

export default class BasePage {
  constructor(readonly page: Page) {}

  async selectAll(): Promise<void> {
    const modifierKey = process.platform === "win32" ? "Control" : "Meta";
    await this.page.keyboard.press(`${modifierKey}+A`);
  }
}
