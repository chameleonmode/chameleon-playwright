import { BrowserContext, Locator } from "@playwright/test";
import { random, rando, trySequentially } from "../../lib/utils.js";
import { Base } from "../base.js";
import Player from "../player.js";
import configure, { Options, Scope } from "./settings.js";
import { generation } from "../../lib/ask.js";

export class Reddit extends Base {
  constructor(
    readonly ctx: BrowserContext,
    readonly opts: Options,
    readonly scenario: (url: string) => Promise<number | unknown>,
    readonly searched: string[] = []
  ) {
    super(ctx, opts, scenario);
  }

  // on every try
  // TODO: refactoroo
  override async onTry(url: string) {
    const todo =
      url === "https://www.reddit.com"
        ? this.opts.args.search.length
        : this.opts.settings.start.urls.length;
    const done = this.searched.length;
    console.log(`onTry: ${done} of ${todo} search terms completed`);

    // check if we have completed all search terms
    if (todo === 0 || (url !== "https://www.reddit.com" && this.page.url().startsWith(url)))
      return this.error("No more todos");
    else if (done > 0) await this.onRetry();

    // check if we are on the right page
    await this.nap();
    await this.searcho(undefined, url === "https://www.reddit.com" ? url : undefined);
  }

  // on every retry
  // TODO: refactoroo
  override async onRetry(url?: string) {
    await this.nap();
    while (
      !this.page
        .url()
        .startsWith(
          this.opts.args.search.length > 0
            ? "https://www.reddit.com/search/"
            : url ?? "https://www.reddit.com/r/"
        )
    ) {
      await this.page.goBack({ waitUntil: "load" });
      await this.nap({
        ...this.timeouts.naps,
        multiplier: random(3, 6),
      });
    }
  }

  // search for a term on Reddit
  async searcho(text: string | undefined = this.opts.args.search.pop(), goTo?: string) {
    if (text === undefined || goTo) {
      const url = this.opts.settings.start.urls.shift();
      if (url) {
        await this.navigate(url);
        await this.nap();
        this.searched.push(url);
      }
      if (!goTo || text === undefined) return;
    }

    const locator = this.page.locator(`faceplate-search-input`).getByRole("textbox");
    await this.click(locator);
    await this.selectAll(locator);
    await this.nap();
    await locator.press("Backspace");
    await this.pressSequentially(locator, text, false);
    await locator.press("Enter");
    await this.nap();
    this.searched.push(text);
  }

  // find an active context
  async findo(funco: () => Promise<unknown>, visited: number[] = []) {
    const localator =
      this.opts.args.scope === "Posts"
        ? this.page.getByRole("button", { name: "Posts" }).first()
        : this.page.locator(`#search-results-page-tab-${this.opts.args.scope.toLowerCase()}`).first();
    await this.click(localator);

    // TODO: refactor
    if (
      this.opts.args.scope !== "Communities" &&
      this.opts.args.sort !== "Relevance" &&
      visited.length === 0
    ) {
      const sortLocator = this.page.locator(`search-sort-dropdown-menu`).first();
      await this.click(sortLocator);

      // Function to click a sort option by its text
      const clickSortOptionByText = async () => {
        // Normalize the text to handle spacing differences
        const normalizedText =
          this.opts.args.scope === "Comments" &&
          (this.opts.args.sort === "Comments" || this.opts.args.sort === "Hot")
            ? "Top"
            : this.opts.args.sort.trim();
        const normalizedOption = normalizedText === "Comments" ? "Comment count" : normalizedText;

        try {
          // Locate the option by its display text
          const sortOption = this.page.locator(`li a span:has-text("${normalizedOption}")`).first();

          // First scroll the option into view
          await sortOption.scrollIntoViewIfNeeded();

          // Wait a brief moment to ensure it's properly visible
          await this.page.waitForTimeout(200);

          // Get the parent 'a' element which is the actual clickable link
          const parentLink = sortOption.locator("xpath=./ancestor::a");

          // Click the link
          await parentLink.click();

          console.log(`Successfully clicked on the "${normalizedOption}" sort option`);
        } catch (error) {
          console.error(`Failed to click sort option "${normalizedOption}":`, error);

          // Alternative approach using evaluate if the above fails
          try {
            await this.page.evaluate((text) => {
              const elements = Array.from(document.querySelectorAll("li a span"));
              const targetElement = elements.find((el) => el.textContent?.includes(text));
              if (targetElement) {
                targetElement.closest("a")?.click();
                return true;
              }
              return false;
            }, normalizedOption);
            console.log(`Clicked on "${normalizedOption}" using evaluate method`);
          } catch (evalError) {
            console.error(`Alternative method also failed:`, evalError);
          }
        }
      };
      await clickSortOptionByText();
    }

    // TODO: refactor
    if (
      (this.opts.args.scope === "Posts" || this.opts.args.scope === "Media") &&
      this.opts.args.sort !== "Hot" &&
      this.opts.args.sort !== "New" &&
      this.opts.args.filter !== "All" &&
      visited.length === 0
    ) {
      const sortLocator = this.page.locator(`search-sort-dropdown-menu`);
      await this.click(sortLocator.nth(1));

      // Function to click a time range option by its text
      const clickTimeRangeByText = async () => {
        // Now find and click the option
        const optionText =
          this.opts.args.filter === "Today"
            ? this.opts.args.filter.trim()
            : "Past " + this.opts.args.filter.trim().toLowerCase();
        try {
          // First approach - target by the exact text
          const exactOption = this.page.locator(`li a span:has-text("${optionText}")`).first();

          // Get the containing link element
          const linkElement = exactOption.locator("xpath=./ancestor::a");

          // Scroll into view and click
          await linkElement.scrollIntoViewIfNeeded();
          await this.page.waitForTimeout(200);
          await linkElement.click();

          console.log(`Clicked on "${optionText}" time range option`);
          return true;
        } catch (error) {
          console.error(`Failed to click time range "${optionText}":`, error);

          // Try alternative approach using the specific structure
          try {
            // Find all list items in the dropdown
            const listItems = this.page.locator("search-sort-dropdown-menu#search_modifier_time_range li");
            const count = await listItems.count();

            for (let i = 0; i < count; i++) {
              const item = listItems.nth(i);
              const text = await item.locator("span span.text-14").textContent();

              if (text?.trim().includes(optionText)) {
                // Find the link within this item
                const link = item.locator("a");
                await link.scrollIntoViewIfNeeded();
                await this.page.waitForTimeout(200);
                await link.click();

                console.log(`Clicked on "${optionText}" time range option (alternative method)`);
                return true;
              }
            }

            console.error(`Could not find time range option "${optionText}" among ${count} options`);
            return false;
          } catch (alternativeError) {
            console.error(`Alternative method also failed:`, alternativeError);
            return false;
          }
        }
      };
      await clickTimeRangeByText();
    }

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
      return scopeToTestIdsMap[this.opts.args.scope];
    })();

    for (let i = 0; i < this.opts.settings.start.attempts; i++) {
      console.debug(`Attempts remaining: ${this.opts.settings.start.attempts}`, i);
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
        await this.onRetry();
      }
    }

    throw this.error(
      `Failed to find a thread with open comments after ${this.opts.settings.start.attempts} attempts.`
    );
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
    joinConversation: async () => {
      try {
        const seeFullDiscussionLink = this.page.locator('a:has-text("See full discussion")');
        if ((await seeFullDiscussionLink.count()) > 0) await this.click(seeFullDiscussionLink.first());
      } catch (error) {
        console.warn("Error clicking 'See full discussion' link:", error);
      }
      await this.scrollabit();
      const { count, locator, id } = await this.find(
        [
          'comment-composer-host slot[name="ready"] faceplate-textarea-input[data-testid="trigger-button"]',
          'comment-composer-host[slot="ready"] faceplate-tracker faceplate-textarea-input[data-testid="trigger-button"]',
        ],
        "selector"
      );
      return locator.first();
    },

    // find a post
    assert: async () => {
      if (!this.opts.args.search || this.opts.args.scope === "Communities") {
        await this.scrollabit();
        const posts = this.page.locator("a[slot='title']");
        const count = await posts.count();
        const index = random(0, count);
        const randomPost = posts.nth(index);
        await this.click(randomPost);
      }
    },

    // find a comment
    getComment: async (nth = -1) => {
      await this.scrollabit();
      const locator = this.page.locator("shreddit-comment");
      const count = await locator.count();
      const index = nth < 0 ? random(0, count) : nth;
      const comment = this.bang("Comment not found", locator.nth(index));
      await comment.waitFor({ timeout: this.timeouts.wait });
      return {
        text: await this.txtContent("div[slot='comment']", comment),
        locator: comment,
      };
    },

    // add a comment to the main thread
    addComment: async (comment: () => Promise<string>) => {
      // Click the comment button
      const result = await trySequentially([
        async () => await this.click(await this.post.joinConversation()),
        async () => await this.click(this.page.getByRole("button", { name: "Add a comment" })),
        async () => {
          const triggers = this.page.getByTestId("trigger-button");
          const count = await triggers.count();
          for (let i = count - 1; i >= 0; i--) {
            const trigger = triggers.nth(i);
            try {
              await this.click(trigger);
              break;
            } catch (error) {
              console.error(`Error clicking trigger button ${i}:`, error);
            }
          }
        },
      ]);
      this.bang("Comment button not found", result);

      // Continue with comment input
      await this.pressSequentially(
        this.page.locator("#subgrid-container").getByRole("textbox"),
        await comment()
      );

      // Submit comment
      await this.click(this.page.locator('button.button-primary[slot="submit-button"]'));
    },

    // reply to a comment
    replyToComment: async (locator: Locator, reply: () => Promise<string>) => {
      await locator.scrollIntoViewIfNeeded();
      await this.nap();
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

  // user
  readonly user = {
    // check the member is following a user or not if not then follow the user.
    follower: async () => {
      await this.click(
        this.bang("'Follow' button not found", this.page.locator("div[slot='button-follow']").first())
      );
    },
  };

  // subreddit
  readonly subreddit = {
    // assert can post
    canPost: async () => {
      await this.nap();
      await this.click(this.page.locator("#subgrid-container faceplate-tracker[noun=create_post]").first());
    },

    // vote on a post
    voter: async () => {
      await this.scrollabit();
      const ups = this.page.getByRole("button", { name: "Upvote" });
      const downs = this.page.getByRole("button", { name: "Downvote" });
      const [upCount, downCount] = await Promise.all([ups.count(), downs.count()]);

      // ensure we don't exceed the number of available votes
      const count = Math.min(upCount, downCount);
      const length = Math.min(count, this.rando);
      for (let i = 0; i < length; i++) {
        const index = random(0, count);
        await (rando() ? this.click(ups.nth(index)) : this.click(downs.nth(index)));
      }

      return {
        ups: {
          locator: ups,
          count: upCount,
        },
        downs: {
          locator: downs,
          count: downCount,
        },
      };
    },

    // check the member is joined the subreddit or not if not then join the subreddit.
    joiner: async () => {
      // Click the "Join" button
      await this.click(
        this.bang(
          "'Join' button not found",
          this.page.getByRole("button", { name: "Join", exact: true }).first()
        )
      );
    },
  };

  // create a new post
  async poster(contents: () => Promise<{ title: string; content: string }>) {
    await this.nap();
    const titleLocator = this.page.locator("#innerTextArea").first();
    const bodyLocator = this.page.locator('div[slot="rte"][aria-label="Post body text field"]');

    const postTypeValue = await this.page.locator('r-post-type-select[name="type"]').getAttribute("value");
    this.bang("Post type not found", postTypeValue === "TEXT");
    this.bang("Post body text field not found", await bodyLocator.innerText());
    this.bang("Post title text field not found", await titleLocator.count());

    const { title, content } = await contents();
    await this.pressSequentially(titleLocator, title);
    await this.pressSequentially(bodyLocator, content);

    const submitButton = this.page
      .locator("r-post-form-submit-button#submit-post-button")
      .getByRole("button");
    await this.click(submitButton);

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

export default async function (
  ctx: BrowserContext,
  opts?: Partial<Options>,
  action?: (url?: string) => Promise<unknown>
) {
  const bypass =
    opts?.settings?.start.all || (opts?.args?.search && opts?.args?.search?.length > 0);
  const options = configure({
    args: {
      scope: "Posts",
      sort: "Relevance",
      filter: "All",
      ...opts?.args,
      search: bypass ? opts?.args?.search ?? ["undefined"] : [],
    },
    settings: {
      start: {
        new: true,
        all: false,
        attempts: 9,
        feature: "reddit",
        rando: { min: 6, max: 9 },
        iterations: { min: 3, max: 6 },
        variations: { min: 1, max: 3 },
        ...opts?.settings?.start,
        urls: bypass
          ? ["https://www.reddit.com", ...(opts?.settings?.start.urls ?? [])]
          : opts?.settings?.start.urls ?? ["https://www.reddit.com"],
      },
      timeouts: {
        navigate: 60,
        default: 30,
        wait: 15,
        naps: {
          min: 256,
          max: 512,
          multiplier: 0,
        },
        ...opts?.settings?.timeouts,
      },
    },
  });
  const scenario = async (url: string) => {
    console.log("Scenario URL:", url);
    // TODO: refactoroo
    // const searches: string[] = [...reddit.opts.args.search];
    // const iterations = { ...reddit.opts.settings.start.iterations };
    if (action && url.startsWith("https://www.reddit.com/r/")) {
      for (let i = 0; i < options.settings.start.attempts; i++) {
        try {
          reddit.opts.args.search.length = 0;
          reddit.opts.settings.start.iterations = { min: 1, max: 1 };
          reddit.opts.settings.start.variations = { min: 1, max: 1 };
          return await action(url);
        } catch (e) {
          console.warn("Error in action function:", e);
          await reddit.page.reload({ waitUntil: "load" });
        } finally {
          // TODO: refactoroo
          // reddit.opts.args.search.push(...searches);
          // reddit.opts.settings.start.iterations = iterations;
        }
      }
    } else if (action) {
      const expecto = await reddit.findo(async () => await action(), player.visited);
      return expecto.index;
    } else {
      console.warn("No action provided");
      return undefined;
    }
  };
  const reddit = new Reddit(ctx, options, scenario);
  if ((reddit.opts.settings.start.all || reddit.opts.args.search) && reddit.variations > 1) {
    // loop through the search terms and generate new ones
    const addedTerms: string[] = [];
    for (const term of reddit.opts.args.search) {
      const generatedTerms = await generation({
        type: "search",
        amount: reddit.variations,
        keyword: term,
        feature: reddit.opts.settings.start.feature,
      });
      addedTerms.push(...generatedTerms);
    }
    // add the generated terms to the search array
    reddit.opts.args.search.push(...addedTerms);
  }
  const player = await Player(reddit);
  return {
    reddit,
    player,
  };
}
