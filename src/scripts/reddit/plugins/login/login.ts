import { Reddit } from "../../reddit.js";

export class Login {
	constructor(readonly pager: Reddit) {}
	// Check authentication
	async checkLoginAuthentication() {
		const locato = this.pager.page.locator("#login-button").first();
		this.pager.bang("Login button", await locato.isVisible(), locato);
		await this.pager.click(locato);
	}

	// Login with credentials
	async loginWithCredentials(email: string, password: string) {
		await this.checkLoginAuthentication();

		//
		const loginUserNameInput = this.pager.page.locator("faceplate-text-input#login-username input");
		await this.pager.pressSequentially(loginUserNameInput, email);
		await this.pager.page.keyboard.press("Tab");

		const loginUserPassword = this.pager.page.locator("faceplate-text-input#login-password input");
		await this.pager.pressSequentially(loginUserPassword, password);

		const loginUserButton = this.pager.page.getByRole("button", { name: "Log In" });
		await this.pager.click(loginUserButton);
	}

	// Login google
	async loginWithGoogle(email: string, password: string) {
		await this.checkLoginAuthentication();

		// Step 2: Find and click the Google sign-in button inside iframe
		const { frame } = await this.pager.findFrame([
			'iframe[src*="accounts.google.com/gsi/button"]',
			'iframe[allow="identity-credentials-get"]',
			'iframe[id^="gsi_"]',
			'iframe[title="Sign in with Google Button"]',
			'iframe[title*="Google"]',
		]);
		await frame.locator('div[role="button"]').click();

		// Step 3: Handle the Google authentication popup
		const popup = await this.pager.page.waitForEvent("popup");
		await popup.waitForLoadState();

		// Check if we have saved accounts to select from
		const emailButtons = popup.locator("[data-email]");
		if ((await emailButtons.count()) > 0) {
			// Use existing account
			return await emailButtons.first().click();
		}

		// Enter email
		const emailInput = popup.getByLabel("Email or phone");
		await this.pager.pressSequentially(emailInput, email);

		// Click next after email
		const nextButton = popup.locator("div#identifierNext button");
		await this.pager.click(nextButton);

		// Enter password if needed
		const passwordInput = popup.getByLabel("Enter your password");
		await this.pager.pressSequentially(passwordInput, password);

		// Complete login
		const passwordNextButton = popup.locator("div#passwordNext button");
		await this.pager.click(passwordNextButton);
	}
}
