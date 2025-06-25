import { Reddit } from "../../reddit.js";

export class Subreddit {
  constructor(readonly pager: Reddit) {}

  // Assert if user can create a post
  async canPost() {
    await this.pager.nap();
    await this.pager.click(this.pager.page.locator("#subgrid-container faceplate-tracker[noun=create_post]").first());
  }

  // Navigate to subreddit community
  async visitCommunity() {
    await this.pager.click(
      this.pager.bang("'visit' button", this.pager.page.locator('span.avatar a[href^="/r/"]').first())
    );
  }

  // Vote on posts (upvote/downvote)
  async voter() {
    const scopeulator = this.pager.scopeulate();
    
    // Join conversation if not in community or people scope
    if (!scopeulator.community && !scopeulator.people) {
      const banger = await this.pager.joinConversation();
      this.pager.bang("vote", banger);
    }
    
    await this.pager.scrollabit();
    
    // Get upvote and downvote buttons
    const ups = this.pager.page.getByRole("button", { name: "Upvote" });
    const downs = this.pager.page.getByRole("button", { name: "Downvote" });
    const upCount = await ups.count();
    const downCount = await downs.count();

    // Calculate voting limits to avoid errors
    const count = Math.min(upCount, downCount) - 1;
    const length = Math.min(
      count,
      Math.floor(Math.random() * (this.pager.opts.settings.start.rando.max - this.pager.opts.settings.start.rando.min + 1)) + this.pager.opts.settings.start.rando.min
    );
    
    this.pager.bang("Vote count", length, { upCount, downCount, count, length });
    
    // Perform voting with 95% upvote bias
    for (let i = 0; i < length; i++) {
      await this.pager.click(Math.random() * 100 <= 95 ? ups.nth(i) : downs.nth(i));
    }

    return {
      ups: { locator: ups, count: upCount },
      downs: { locator: downs, count: downCount },
    };
  }

  // Join subreddit if not already a member
  async joiner() {
    await this.pager.scrollabit();
    
    // Click the "Join" button
    await this.pager.click(
      this.pager.bang("'Join' button", this.pager.page.getByRole("button", { name: "Join", exact: true }).first())
    );
  }

  // Create a new post with title and content
  async poster(contents: () => Promise<{ title: string; content: string }>) {
    await this.pager.nap();
    
    // Locate form elements
    const titleLocator = this.pager.page.locator("#innerTextArea").first();
    const bodyLocator = this.pager.page.locator('div[slot="rte"][aria-label="Post body text field"]');

    // Verify post type is text
    const postTypeValue = await this.pager.page.locator('r-post-type-select[name="type"]').getAttribute("value");
    this.pager.bang("Post type", postTypeValue === "TEXT");
    this.pager.bang("Post body text field", await bodyLocator.innerText());
    this.pager.bang("Post title text field", await titleLocator.count());

    // Fill in post content
    const { title, content } = await contents();
    await this.pager.pressSequentially(titleLocator, title);
    await this.pager.pressSequentially(bodyLocator, content);

    // Submit the post
    const submitButton = this.pager.page
      .locator("r-post-form-submit-button#submit-post-button")
      .getByRole("button");
    await this.pager.click(submitButton);

    // const traverse = async (
    //   condition: (ele: {
    //     element: Element | null;
    //     tagName: string | undefined;
    //     ariaLabel: string | null | undefined;
    //   }) => boolean
    // ) => {
    //   while (condition(await this.getFocusedElement())) {
    //     this.page.keyboard.press("Tab");
    //   }
    // };

    // // enter comment
    // // await traverse((ele) => {
    // //   return ele.ariaLabel !== "Post body text field";
    // // });
    // // await this.type(content);
    // // submit
    // await traverse((ele) => {
    //   return ele.tagName !== "R-POST-FORM-SUBMIT-BUTTON";
    // });

    // await this.page.keyboard.press("Enter");
    // await this.nap();
  }
}
