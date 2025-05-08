import { BrowserContext, Locator } from "@playwright/test";
import { random, rando, trySequentially } from "../../lib/utils.js";
import { Base } from "../base.js";
import Player from "../player.js";
import { configure, Args, Options, Scope, Sort, BASE_URL, Filter } from "./reddit.js";
import { AI } from "../../types.js";
import { Logger } from "../../lib/logger.js";
import { promptee } from "../../lib/ask.js";



export class Reddit extends Base {
  readonly searched: string[] = [];
  constructor(
    readonly ctx: BrowserContext,
    readonly opts: Options,
    readonly scenario: (url: string) => Promise<number | unknown>
  ) {
    super(ctx, opts, scenario);
  }

  // check todo's and done
  override status() {
    const done = this.visited.length + this.searched.length;
    const todo = this.opts.settings.start.urls.length + this.opts.args.search.length;
    const visit = this.opts.settings.start.urls.length - this.visited.length;
    const search = this.opts.args.search.length - this.searched.length;
    const searched = search === 0 && this.opts.args.search.length > 0;
    Logger.log(`Todo: ${todo} of ${done} completed`);
    Logger.log(`Search: ${this.opts.args.search.length} of ${this.searched.length} completed`);
    Logger.log(`Visit: ${this.opts.settings.start.urls.length} of ${this.visited.length} completed`);
    return { todo, done, visit, search, searched };
  }

  // on every try
  override async onTry(url: string): Promise<void | Error> {
    const { todo, done, visit, search, searched } = this.status();
    const basic = this.scopeulation.community(url) || url === BASE_URL;
    // check if we have completed all urls we need to also search on
    if (searched && !this.visited.includes(url) && basic) {
      this.searched.length = 0;
      return await this.onTry(url);
    }

    // check if we have completed all terms
    return search > 0 && basic
      ? await this.searcho()
      : visit > 0 && !this.visited.includes(url)
      ? await this.navigato(url)
      : this.error(`All terms completed.`);
  }

  // on every retry/iteration
  override async onIteration(url: string) {
    await this.nap();
    const started =
      this.scopeulation.comments(url) || this.scopeulation.search(url)
        ? url
        : url.endsWith("/")
        ? url + "search"
        : url + "/search";
    while (!this.page.url().startsWith(started)) {
      await this.page.goBack({ waitUntil: "load" });
      await this.nap({
        ...this.timeouts.naps,
        multiplier: random(3, 6),
      });
    }
  }

  // search for a term on Reddit
  async navigato(url: string) {
    await this.navigate(url);
    this.visited.push(url);
  }

  async searcho() {
    const url = this.opts.settings.start.urls[this.visited.length];
    const navigate = this.searched.length === 0 && !this.visited.includes(url);
    if (navigate) await this.navigato(url);
    else await this.onIteration(this.visited[this.visited.length - 1]);

    const text = this.opts.args.search[this.searched.length];
    const locator = this.page.locator(`faceplate-search-input`);
    const textbox = locator.getByRole("textbox");
    await this.click(textbox);

    try {
      const clearButton = locator.getByRole("button", { name: "Clear search" });
      await this.click(clearButton, random(3000, 9000));
    } catch (e) {
      Logger.warn("Error clicking clear button:", e);
    }

    await this.pressSequentially(textbox, text, false);
    await this.nap({
      ...this.timeouts.naps,
      multiplier: 3,
    });
    await textbox.press("Enter");
    await this.nap();
  }

  // find an active context
  async findo(funco: () => Promise<unknown>, visited: number[] = []) {
    const scopeulator = this.scopeulation.tranform();
    const findulator = (() => {
      const mapper: {
        [key in Scope]: { ids: string[]; strat: "testId" | "selector" | "text" };
      } = {
        Posts: { ids: ["search-post-with-content-preview", "search-post-unit"], strat: "testId" },
        Comments: { ids: ["search-sdui-comment-unit"], strat: "testId" },
        Media: { ids: ["div[data-id='search-media-post-unit']"], strat: "selector" },
        People: { ids: ["search-author"], strat: "testId" },
        Communities: { ids: ["search-community"], strat: "testId" },
      };

      // If not a user provided URL, we might need a different scope
      return mapper[scopeulator.scope];
    })();
    // TODO: refactor
    try {
      if (!scopeulator.type) {
        await this.click(
          scopeulator.scope === "Posts"
            ? this.page.getByRole("button", { name: scopeulator.scope }).first()
            : this.page.locator(`#search-results-page-tab-${scopeulator.scope.toLowerCase()}`).first()
        );
      }

      if (visited.length === 0) {
        // Function to click a sort option by its text
        const clickSortOptionByText = async () => {
          const scopes: Scope[] = ["Posts", "Comments", "Media"];
          const sorts: Sort[] = ["Hot", "Top", "New", "Comments"];
          if (
            scopeulator.sort ||
            !scopes.includes(scopeulator.scope) ||
            !sorts.includes(this.opts.args.sort)
          ) {
            return;
          }

          // Click the sort dropdown
          const sortLocator = this.page.locator(`search-sort-dropdown-menu`).first();
          await this.click(sortLocator);

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
            // await this.page.waitForTimeout(200);

            // Get the parent 'a' element which is the actual clickable link
            const parentLink = sortOption.locator("xpath=./ancestor::a");
            // Click the link
            await this.click(parentLink);

            Logger.log(`Successfully clicked on the "${normalizedOption}" sort option`);
          } catch (error) {
            Logger.error(`Failed to click sort option "${normalizedOption}":`, error);

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
              Logger.log(`Clicked on "${normalizedOption}" using evaluate method`);
            } catch (evalError) {
              Logger.error(`Alternative method also failed:`, evalError);
            }
          }
        };
        await clickSortOptionByText();
        await this.nap();

        // Function to click a time range option by its text
        const clickTimeRangeByText = async () => {
          const scopes: Scope[] = ["Posts", "Media"];
          const sorts: Sort[] = ["Relevance", "Top", "Comments"];
          const filters: Filter[] = ["Year", "Month", "Week", "Today", "Hour"];
          if (
            scopeulator.t ||
            scopeulator.sort === "communities" ||
            !scopes.includes(scopeulator.scope) ||
            !sorts.includes(this.opts.args.sort) ||
            !filters.includes(this.opts.args.filter)
          ) {
            return;
          }
          // Click the time range dropdown
          const sortLocator = this.page.locator(`search-sort-dropdown-menu`);
          await this.click(sortLocator.nth(1));

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
            await this.click(linkElement);

            Logger.log(`Clicked on "${optionText}" time range option`);
            return true;
          } catch (error) {
            Logger.error(`Failed to click time range "${optionText}":`, error);

            // Try alternative approach using the specific structure
            try {
              // Find all list items in the dropdown
              const listItems = this.page.locator(
                "search-sort-dropdown-menu#search_modifier_time_range li"
              );
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

                  Logger.log(`Clicked on "${optionText}" time range option (alternative method)`);
                  return true;
                }
              }

              Logger.error(`Could not find time range option "${optionText}" among ${count} options`);
              return false;
            } catch (alternativeError) {
              Logger.error(`Alternative method also failed:`, alternativeError);
              return false;
            }
          }
        };
        await clickTimeRangeByText();
      }
    } catch (e) {
      Logger.warn("Error in findo function:", e);
    }

    for (let i = 0; i < this.opts.settings.start.attempts; i++) {
      Logger.debug(`Attempts remaining: ${this.opts.settings.start.attempts}`, i);
      await this.nap();
      await this.scrollabit();

      // Wait for thread elements to be available
      const { count, locator, id } = await this.find(findulator.ids, findulator.strat);

      // Filter out indices we've already tried
      const availableIndices = Array.from({ length: count }, (_, i) => i).filter(
        (index) => !visited.includes(index)
      );
      this.bang("available threads", availableIndices.length > 0, {
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
          visited,
        };
      } catch (e) {
        Logger.warn("Func is archived or removed.", e);
        visited.push(index);
        await this.page.reload({ waitUntil: "load" });
        await this.onIteration(this.visited[this.visited.length - 1]);
      }
    }

    throw this.error(
      `Failed to find a thread with open comments after ${this.opts.settings.start.attempts} attempts.`
    );
  }

  // patterns scopeulation
  readonly scopeulation = {
    community(url: string) {
      const pattern = /\/r\/[^/]+\/?$/;
      return pattern.test(url);
    },

    comments(url: string) {
      const pattern = /\/r\/[^/]+\/comments(?:\/.*)?$/;
      return pattern.test(url);
    },

    search(url: string) {
      const pattern = /\/r\/[^/]+\/search(?:\/.*)?$/;
      return pattern.test(url);
    },

    tranform: () => {
      const scopes: Scope[] = ["People", "Communities"];
      const url = this.visited[this.visited.length - 1];
      const Url = new URL(url);
      const type = Url.searchParams.get("type");
      const scope =
        scopes.includes(this.opts.args.scope) &&
        (this.scopeulation.community(url) ||
          this.scopeulation.comments(url) ||
          this.scopeulation.search(url))
          ? "Posts"
          : this.opts.args.scope;
      return {
        scope,
        url,
        Url,
        type,
        sort: Url.searchParams.get("sort"),
        t: Url.searchParams.get("t"),
        community: scope === "Communities" || type === "communities",
      };
    },
  };

  // login
  readonly login = {
    // Check authentication
    checkLoginAuthentication: async () => {
      const locato = this.page.locator("#login-button").first();
      this.bang("Login button", await locato.isVisible(), locato);
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
        Logger.warn("Error clicking 'See full discussion' link:", error);
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
      const scopeulator = this.scopeulation.tranform();
      if (scopeulator.scope === "Communities" || scopeulator.type === "communities") {
        await this.scrollabit();
        const posts = this.page.locator("a[slot='title']");
        const count = await posts.count();
        const index = random(0, count);
        const randomPost = posts.nth(index);
        await this.click(randomPost);
      }
    },

    // find a comment
    getComments: async (max = 3) => {
      await this.scrollabit();
      const locator = this.page.locator("shreddit-comment");
      const count = await locator.count();
      const comments: string[] = [];
      for (let i = 0; i < Math.min(max, count); i++) {
        comments.push(await this.txtContent("div[slot='comment']", locator.nth(i)));
      }
      return comments;
    },

    // find a comment
    getComment: async (nth = -1) => {
      await this.scrollabit();
      const locator = this.page.locator("shreddit-comment");
      const count = await locator.count();
      const index = nth < 0 ? random(0, count - 1) : nth;
      const comment = this.bang("Comment", locator.nth(index));
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
              Logger.error(`Error clicking trigger button ${i}:`, error);
            }
          }
        },
      ]);
      this.bang("Comment button", result);

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
        this.bang("'visit' button", this.page.locator('span.avatar a[href^="/r/"]').first())
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
      const scopeulator = this.scopeulation.tranform();
      if (scopeulator.scope === "Communities" || scopeulator.type === "communities") {
        await this.scrollabit();
      } else {
        const banger = await this.post.joinConversation();
        this.bang("vote", banger);
      }
      const ups = this.page.getByRole("button", { name: "Upvote" });
      const downs = this.page.getByRole("button", { name: "Downvote" });
      const [upCount, downCount] = await Promise.all([ups.count(), downs.count()]);

      // ensure we don't exceed the number of available votes
      const count = Math.min(upCount, downCount) - 1;
      const length = Math.min(count, this.rando);
      this.bang("Vote count", length > 0, { upCount, downCount, count });
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
    this.bang("Post type", postTypeValue === "TEXT");
    this.bang("Post body text field", await bodyLocator.innerText());
    this.bang("Post title text field", await titleLocator.count());

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
  // Determine URLs based on args.search and settings
  const options = configure({
    ai: opts?.ai,
    args: opts?.args,
    settings: opts?.settings,
  });

  const reddit = new Reddit(ctx, options, async (url: string): Promise<unknown> => {
    Logger.log("Scenario URL:", url);

    if (action && reddit.scopeulation.comments(url)) {
      for (let i = 0; i < options.settings.start.attempts; i++) {
        try {
          reddit.iterations = 1;
          reddit.variations = 1;
          return await action(url);
        } catch (e) {
          Logger.warn("Error in action function:", e);
          await reddit.page.reload({ waitUntil: "load" });
        } finally {
          Logger.log("Action function completed");
          // TODO: refactoroo
          // reddit.opts.args.search.push(...searches);
          // reddit.opts.settings.start.iterations = iterations;
        }
      }
    } else if (action) {
      try {
        const expecto = await reddit.findo(async () => await action(), player.visited);
        return expecto.index;
      } catch (e) {
        Logger.warn("Error in action function:", e);
      } finally {
        const text = reddit.opts.args.search[reddit.searched.length];
        reddit.searched.push(text);
        Logger.log("Action function completed");
      }
    } else {
      Logger.warn("No action provided");
    }
    return undefined;
  });

  const player = await Player(reddit);
  return {
    reddit,
    player,
  };
}
