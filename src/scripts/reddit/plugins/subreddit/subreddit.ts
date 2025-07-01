import { Funco, Parameters } from "../../../../lib/types/index.js";
import { bang } from "../../../../lib/utils.js";
import { Options } from "../../configure.js";
import Reddito, { Reddit } from "../../reddit.js";

export class Subreddit {
  constructor(readonly reddit: Reddit) {}

  // Assert if user can create a post
  async canPost() {
    await this.reddit.nap();
    await this.reddit.click(this.reddit.page.locator("#subgrid-container faceplate-tracker[noun=create_post]").first());
  }

  // Navigate to subreddit community
  async visitCommunity() {
    const locator = this.reddit.page.locator('span.avatar a[href^="/r/"]');
    await this.reddit.click(
      bang("'visit' button", locator.first(), { locator })
    );
  }

  // Vote on posts (upvote/downvote)
  async voter() {
    const scopeulator = this.reddit.scopeulate();
    
    // Join conversation if not in community or people scope
    if (!scopeulator.community && !scopeulator.people) {
      const banger = await this.reddit.joinConversation();
      bang("vote", banger, { scopeulator });
    }
    
    await this.reddit.scrollabit();
    
    // Get upvote and downvote buttons
    const ups = this.reddit.page.getByRole("button", { name: "Upvote" });
    const downs = this.reddit.page.getByRole("button", { name: "Downvote" });
    const upCount = await ups.count();
    const downCount = await downs.count();

    // Calculate voting limits to avoid errors
    const count = Math.min(upCount, downCount) - 1;
    const length = Math.min(count, this.reddit.opts.settings.start.rando.min);
    bang("Vote count", length > 0, { upCount, downCount, count, length });
    
    // Perform voting with 95% upvote bias
    for (let i = 0; i < length; i++) {
      await this.reddit.click(Math.random() * 100 <= 95 ? ups.nth(i) : downs.nth(i));
    }

    return {
      ups: { locator: ups, count: upCount },
      downs: { locator: downs, count: downCount },
    };
  }

  // Join subreddit if not already a member
  async joiner() {
    await this.reddit.scrollabit();
    
    // Click the "Join" button
    const locator = this.reddit.page.getByRole("button", { name: "Join", exact: true }).first();
    await this.reddit.click(
      bang("'Join' button", locator.first(), { locator })
    );
  }

  // Create a new post with title and content
  async poster(contents: () => Promise<{ title: string; content: string }>) {
    await this.reddit.nap();
    
    // Locate form elements
    const titleLocator = this.reddit.page.locator("#innerTextArea").first();
    const bodyLocator = this.reddit.page.locator('div[slot="rte"][aria-label="Post body text field"]');

    // Verify post type is text
    const postTypeValue = await this.reddit.page.locator('r-post-type-select[name="type"]').getAttribute("value");
    bang("Post type", postTypeValue === "TEXT", { postTypeValue });
    bang("Post body text field", await bodyLocator.innerText(), {bodyLocator});
    bang("Post title text field", await titleLocator.count(), {titleLocator});

    // Fill in post content
    const { title, content } = await contents();
    await this.reddit.pressSequentially(titleLocator, title);
    await this.reddit.pressSequentially(bodyLocator, content);

    // Submit the post
    const submitButton = this.reddit.page
      .locator("r-post-form-submit-button#submit-post-button")
      .getByRole("button");
    await this.reddit.click(submitButton);
  }
}

export default async function (params: Parameters<Options>, action: Funco) {
  const { reddit } = await Reddito(params, action);
  const subreddit = new Subreddit(reddit);
  return { reddit, subreddit };
}