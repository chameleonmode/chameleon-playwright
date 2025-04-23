import { BrowserContext, Locator, expect } from "@playwright/test";
import { random, rando } from "../../lib/utils.js";
import { Base } from "../page.js";
import Player from "../player.js";
import configure, { Options, Scope, defaults } from "./settings.js";

export class Reddit extends Base {
  constructor(readonly context: BrowserContext, readonly opts: Options) {
    super(context, opts);
  }
  
  // login
  readonly login = {
    // Check authentication
    checkLoginAuthentication: async () => {
      const locato = this.page.locator("#login-button").first();
      this.bang("Login button not found", await locato.isVisible(), locato);
      await this.click(locato);
    },

    // Login with credentials
    loginWithCredentials: async (email: string, password: string) => {
      await this.login.checkLoginAuthentication();

      //
      const loginUserNameInput = this.page.locator("faceplate-text-input#login-username input");
      await this.pressSequentially(loginUserNameInput, email);
      await this.page.keyboard.press("Tab");

      const loginUserPassword = this.page.locator("faceplate-text-input#login-password input");
      await this.pressSequentially(loginUserPassword, password);

      const loginUserButton = this.page.getByRole("button", { name: "Log In" });
      await this.click(loginUserButton);
    },

    // Login google
    loginWithGoogle: async (email: string, password: string) => {
      await this.login.checkLoginAuthentication();

      // Step 2: Find and click the Google sign-in button inside iframe
      const { frame } = await this.findFrame([
        'iframe[src*="accounts.google.com/gsi/button"]',
        'iframe[allow="identity-credentials-get"]',
        'iframe[id^="gsi_"]',
        'iframe[title="Sign in with Google Button"]',
        'iframe[title*="Google"]',
      ]);
      await frame.locator('div[role="button"]').click();

      // Step 3: Handle the Google authentication popup
      const popup = await this.page.waitForEvent("popup");
      await popup.waitForLoadState();

      // Check if we have saved accounts to select from
      const emailButtons = popup.locator("[data-email]");
      if ((await emailButtons.count()) > 0) {
        // Use existing account
        return await emailButtons.first().click();
      }

      // Enter email
      const emailInput = popup.getByLabel("Email or phone");
      await this.pressSequentially(emailInput, email);

      // Click next after email
      const nextButton = popup.locator("div#identifierNext button");
      await this.click(nextButton);

      // Enter password if needed
      const passwordInput = popup.getByLabel("Enter your password");
      await this.pressSequentially(passwordInput, password);

      // Complete login
      const passwordNextButton = popup.locator("div#passwordNext button");
      await this.click(passwordNextButton);
    },
  };

  // post
  readonly post = {
    title: () => this.txtContent('h1[id^="post-title-"][slot="title"]'),

    // Function to find a comment
    getComment: async (nth = -1, random = Math.random() < 0.5) => {
      const locator = this.page.locator("shreddit-comment");
      const comment = this.bang(
        "Comment not found",
        random && nth < 0 ? this.randoNth(locator, await locator.count()) : locator.nth(nth)
      );
      await comment.waitFor();
      return {
        text: await this.txtContent("div[slot='comment']", comment),
        locator: comment,
      };
    },

    // Function to add a comment to the main thread
    addComment: async (comment: () => Promise<string>) => {
      const locato = this.page.getByRole("button", { name: "Add a comment" });

      // Wait for button to be visible and enabled
      await this.click(locato);

      // Continue with comment input
      await this.pressSequentially(
        this.page.locator("#subgrid-container").getByRole("textbox"),
        await comment()
      );

      // Submit comment
      await this.click(this.page.locator('button.button-primary[slot="submit-button"]'));
    },

    // Function to reply to a comment
    replyToComment: async (locator: Locator, reply: () => Promise<string>) => {
      // Click the reply button
      const comment = locator.locator("shreddit-comment-action-row button").first();
      await this.click(comment);

      // Wait for the reply box to be visible
      const replyBox = locator.locator(
        "shreddit-comment-action-row shreddit-async-loader comment-composer-host faceplate-form shreddit-composer"
      );
      await replyBox.waitFor();
      await this.type(await reply());

      // Click the submit button
      await this.click(replyBox.locator("button[slot='submit-button']").first());
    },

    // visit the subreddit
    visitCommunity: async () => {
      // Click the "Join" button
      await this.click(
        this.bang("'visit' button not found", this.page.locator('span.avatar a[href^="/r/"]').first())
      );
    },
  };

  // get the text content of a locator
  txtContent = async (selector: string, locator?: Locator) => {
    const element = locator?.locator(selector).first() || this.page.locator(selector).first();
    await expect(element).toBeVisible();

    return this.bang(
      "Element not found in" + selector,
      await element.evaluate((ele) => ele?.textContent?.replace(/\s+/g, " ").trim())
    );
  };

  async searcho(text: string) {
    const locator = this.page.locator(`faceplate-search-input`).getByRole("textbox");
    await this.pressSequentially(locator, text);
    await locator.press("Enter");
  }

  async findo(scope: Scope, funco: () => Promise<unknown>, visited: number[] = []) {
    const localator =
      scope === "Posts"
        ? this.page.getByRole("button", { name: "Posts" }).first()
        : this.page.locator(`#search-results-page-tab-${scope.toLowerCase()}`).first();
    await this.click(localator);

    const findulator = (() => {
      const scopeToTestIdsMap: {
        [key in Scope]: { ids: string[]; strat: "testId" | "selector" | "text" };
      } = {
        Posts: { ids: ["search-post-with-content-preview", "search-post-unit"], strat: "testId" },
        Communities: { ids: ["search-community"], strat: "testId" },
        Comments: { ids: ["search-sdui-comment-unit"], strat: "testId" },
        Media: { ids: ["div[data-id='search-media-post-unit']"], strat: "selector" },
        People: { ids: ["search-author"], strat: "testId" },
      };
      return scopeToTestIdsMap[scope];
    })();

    const maxAttempts = random(this.opts.settings.rando.min, this.opts.settings.rando.max);
    for (let i = 0; i < maxAttempts; i++) {
      console.debug(`Attempts remaining: ${maxAttempts - i}`);
      await this.nap();
      await this.scrollabit();

      // Wait for thread elements to be available
      const { count, locator, id } = await this.find(findulator.ids, findulator.strat);

      // Filter out indices we've already tried
      const availableIndices = Array.from({ length: count }, (_, i) => i).filter(
        (index) => !visited.includes(index)
      );
      this.bang("No available threads", availableIndices.length > 0, {
        triedIndices: visited,
        availableIndices,
      });

      // Randomly select an index from the available indices
      const index = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      try {
        const thread = locator.nth(index);
        await this.click(thread);
        const funky = await funco();
        return {
          index,
          funky,
        };
      } catch (e) {
        console.warn("Func is archived or removed.", e);
        visited.push(index);
        await this.page.goBack();
      }
    }

    throw this.error(`Failed to find a thread with open comments after ${maxAttempts} attempts.`);
  }

  // Function to check the member is joined the subreddit or not if not then join the subreddit.
  async joino() {
    // Click the "Join" button
    await this.click(
      this.bang(
        "'Join' button not found",
        this.page.getByRole("button", { name: "Join", exact: true }).first()
      )
    );
  }

  // Function to check the member is following a user or not if not then follow the user.
  async follower() {
    await this.click(
      this.bang("'Follow' button not found", this.page.locator("div[slot='button-follow']").first())
    );
  }

  // UpVote / DownVote available
  async voter() {
    await this.scrollabit();
    const ups = this.page.getByRole("button", { name: "Upvote" });
    const downs = this.page.getByRole("button", { name: "Downvote" });
    const [upCount, downCount] = await Promise.all([ups.count(), downs.count()]);

        // Math.min(upCount, downCount) ensure we don't exceed the number of available votes
    const length = Math.min(
      random(this.opts.settings.rando.min, this.opts.settings.rando.max),
      rando(Math.min(upCount, downCount))
    );

    // Using Array.from with just length
    for (let i = 0; i < length; i++) {
      await (rando() ? this.click(ups.nth(i)) : this.click(downs.nth(i)));
    }
    return {
      ups: {
        locator: ups,
        count: upCount,
      },
      downs: { locator: downs, count: downCount },
    };
  }

  // Create Subreddit Post
  async createPostSubreddit(commentTitle: string, commentText: string) {
    await this.click(this.page.locator("#subgrid-container faceplate-tracker[noun=create_post]").first());
    await this.pressSequentially(this.page.locator("#innerTextArea").first(), commentTitle);

    const traverse = async (
      condition: (ele: {
        element: Element | null;
        tagName: string | undefined;
        ariaLabel: string | null | undefined;
      }) => boolean
    ) => {
      while (condition(await this.getFocusedElement())) {
        this.page.keyboard.press("Tab");
      }
    };

    // enter comment
    await traverse((ele) => {
      return ele.ariaLabel !== "Post body text field";
    });
    await this.type(commentText);

    // submit
    await traverse((ele) => {
      return ele.tagName !== "R-POST-FORM-SUBMIT-BUTTON";
    });

    await this.page.keyboard.press("Enter");
    await this.nap();
  }
}

export default async function (context: BrowserContext, opts?: Partial<Options>) {
  const options = configure({
    start: {
      feature: "reddit",
      url: "https://www.reddit.com",
      new: true,
    },
    args: {
      search: "bobby lee",
      scope: "Posts",
      sort: "Relevance",
      filter: "All time",
    },
    settings: {
      timeouts: {
        ...defaults.settings.timeouts,
      },
      rando: {
        min: 3,
        max: 9,
      },
      // use to find variations of search term from ai
      iterations: {
        min: 3,
        max: 3,
      },
    },
    ...opts,
  });
  const reddit = new Reddit(context, options);
  const player = await Player(reddit);
  await reddit.searcho(options.args.search);
  return {
    reddit,
    options,
    player,
  };
}
