import { Reddit } from "../../reddit.js";

export class User {
  constructor(readonly reddit: Reddit) {}
  // check the member is following a user or not if not then follow the user.
  async follow() {
    await this.reddit.click('div[slot="button-follow"] button:has-text("Follow")');
  }
}
