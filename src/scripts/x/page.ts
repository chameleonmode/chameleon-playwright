import { BrowserContext, Locator, expect } from "@playwright/test";
import { Base } from "../page.js";
import { random, rando } from "../../lib/utils.js";
import Player from "../player.js";
import configure, { Options, Scope, defaults } from "./settings.js";

export class X extends Base {
    constructor(readonly context: BrowserContext, readonly opts: Options) {
        super(context, opts);
    }

    retweetButton = () => this.page.locator(`button[data-testid="retweet"]`);
    articles = () => this.page.locator(`main[role="main"] section article`);
    replyBtnSelector = () => this.page.locator('div[data-testid="toolBar"] button[data-testid="tweetButton"]');
    locator = (selector: string) => { return this.page.locator(selector) }

    // Search for a keyword on X
    async searcho(text: string) {
        const locator = this.page.locator('input[placeholder="Search"]');
        await this.pressSequentially(locator, text);
        await locator.press("Enter");
    }

    // Find a random tweet on X
    async findo(
        funco: () => Promise<unknown>,
        visited: number[] = [],
        scope = this.opts.args.scope,
        retry: () => Promise<unknown> = () => this.page.goBack()) {
        const localator =
            scope === "Top"
                ? this.page.locator('div[role="presentation"]').getByText(scope)
                : this.page.locator('div[role="presentation"]').getByText(scope);
        await this.click(localator);

        const findulator = (() => {
            const scopeToTestIdsMap: {
                [key in Scope]: { ids: string[]; strat: "testId" | "selector" | "text" };
            } = {
                Top: { ids: ["tweet"], strat: "testId" },
                Latest: { ids: ["tweet"], strat: "testId" },
                People: { ids: ["UserCell"], strat: "testId" },
                Media: { ids: ["li[role='listitem']"], strat: "selector" },
                Lists: { ids: ["cellInnerDiv"], strat: "testId" },
            };
            console.log(scopeToTestIdsMap[scope], '--scopeToTestIdsMap[scope]--')
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
                console.log(locator, '--locator.nth(index)--', locator.nth(index), index)
                await this.click(thread);
                const funky = await funco();
                return {
                    index,
                    funky,
                };
            } catch (e) {
                console.warn("Func is archived or removed.", e);
                visited.push(index);
                // await this.page.goBack();
                await retry();
            }
        }

        throw this.error(`Failed to find a thread with open comments after ${maxAttempts} attempts.`);
    }

    // login
    readonly login = {
        // Check authentication
        checkLoginAuthentication: async () => {
            const names = (await this.page.context().cookies()).map(c => c.name);
            this.bang("Login button not found", !names.includes('auth_token') || !names.includes('twid'));
        },

        // Login with credentials
        loginWithCredentials: async (email: string, userName: string, password: string) => {
            await this.login.checkLoginAuthentication();

            // Click the main login button
            const loginButton = this.page.locator('a[data-testid="loginButton"]');
            await this.click(loginButton);

            // Enter email
            const emailInput = this.page.locator('input[autocomplete="username"]');
            await this.pressSequentially(emailInput, email);

            // Click next after email
            const emailNextButton = this.page.locator(`button:has-text("Next")`);
            await this.click(emailNextButton);

            // Enter user name if needed
            const userNameInput = this.page.locator('input[data-testid="ocfEnterTextTextInput"]');
            if (await userNameInput.isVisible()) {
                await this.pressSequentially(userNameInput, userName);
                // Click next after user name
                const userNextButton = this.page.locator(`button[data-testid="ocfEnterTextNextButton"]`);
                await this.click(userNextButton);
            }

            // Enter password
            const passwordInput = this.page.locator('input[name="password"]');
            await this.pressSequentially(passwordInput, password);

            // Complete login
            const submitLoginButton = this.page.locator(`button[data-testid="LoginForm_Login_Button"]`);
            this.click(submitLoginButton);
        },

        // Login google
        loginWithGoogle: async (email: string, password: string) => {
            await this.login.checkLoginAuthentication();

            const frameSelector = 'iframe[src*="accounts.google.com/gsi/button"], iframe[allow="identity-credentials-get"], iframe[id^="gsi_"], iframe[title="Sign in with Google Button"], iframe[title*="Google"]'
            await this.page.waitForSelector(frameSelector, { state: 'attached' });

            const { frame } = await this.findFrame(frameSelector.split(','));
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

    readonly post = {
        // Retweet the top most relevant tweet on X
        retweetTopTweet: async () => {
            const retweetButton = this.retweetButton().first();
            await this.bang("Retweet button not found or not visible", retweetButton.isVisible(), retweetButton);
            await retweetButton.click();
            const confirmSelector = ("retweetConfirm");
            await this.click(this.page.getByTestId(confirmSelector))
        },

        // Function to get a comment
        getTweet: async (nth = 2, random = Math.random() < 0.5) => {
            const comment = this.bang(
                "Comment not found",
                random
                    ? this.articles().nth(Math.floor(Math.random() * (await this.articles().count())))
                    : this.articles().nth(nth)
            );
            // Use a more specific selector to avoid nested matches
            const commentContent = comment.locator('div[data-testid="tweetText"]').first();
            commentContent.scrollIntoViewIfNeeded();
            return {
                text: await commentContent.innerText(),
                locator: comment,
            };
        },

        // Function to reply to the tweet
        replyToTweet: async (locator: Locator, reply: string) => {
            locator.locator('button[data-testid="reply"]').click();
            const replySelector = 'div[data-viewportview="true"] div.DraftEditor-editorContainer';
            const replyBox = this.page.locator(replySelector);
            await this.bang("Reply box not found", replyBox.click(), replyBox);
            await replyBox.type(reply, { delay: random(50, 100) });
            await this.click(this.replyBtnSelector());
        },

        // like on a post
        like: async () => {
            await this.scrollabit();
            const likeButtons = this.page.locator('button[data-testid*="like"]');
            const count = rando((await likeButtons.count()));
            const length = random(
                Math.min(count, this.opts.settings.rando.min),
                Math.min(count, this.opts.settings.rando.max)
            );
            for (let i = 0; i <= length; i++) {
                await this.click(likeButtons.nth(i));
            }
        }
    };

    // create a new post
    poster = async (tweet: string) => {
        await this.pressSequentially(this.page.locator(`div[data-testid="tweetTextarea_0RichTextInputContainer"]`), tweet);
        await this.page.locator(`button[data-testid="tweetButtonInline"]`).first().click();
    }
}

export default async function (context: BrowserContext, opts?: Partial<Options>) {
    const options = configure({
        args: {
            search: "henry cavill",
            scope: "Top",
        },
        settings: {
            timeouts: {
                ...defaults.settings.timeouts,
            },
            start: {
                feature: "x",
                url: "https://x.com",
                new: true,
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
    const x = new X(context, options);
    const player = await Player(x, () => Promise.resolve());
    return {
        x,
        player,
    };
}