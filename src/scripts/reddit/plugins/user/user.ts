import { Reddit } from "../../reddit.js";

export class User {
  constructor(readonly pager: Reddit) {}
  // check the member is following a user or not if not then follow the user.
  async follow() {
    await this.pager.click('div[slot="button-follow"] button:has-text("Follow")');
  }
}
