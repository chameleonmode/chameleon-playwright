import { Reddit } from "../../page.js";

export class User {
  constructor(readonly reddit: Reddit) {}
  // check the member is following a user or not if not then follow the user.
  async follow() {
    await this.reddit.click(
      this.reddit.bang(
        "'Follow' button not found",
        this.reddit.page.locator("div[slot='button-follow']").first()
      )
    );
  }
}
