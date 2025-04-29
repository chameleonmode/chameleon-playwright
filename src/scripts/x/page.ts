import { BrowserContext, Locator, expect } from "@playwright/test";
import { Base } from "../page.js";
import Player from "../player.js";
import configure, { Options, defaults } from "./settings.js";

export class X extends Base {
    constructor(readonly context: BrowserContext, readonly opts: Options) {
        super(context, opts);
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
}

export default async function (context: BrowserContext, opts?: Partial<Options>) {
    const options = configure({
        args: {
            ...defaults.args,
            search: "bobby lee",
            scope: "Posts",
            sort: "Relevance",
        },
        settings: {
            timeouts: {
                ...defaults.settings.timeouts,
            },
            start: {
                feature: "x",
                url: "https://www.x.com",
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