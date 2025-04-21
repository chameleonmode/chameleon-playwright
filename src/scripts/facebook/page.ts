import { Page } from "@playwright/test";
import Base from "../page.js";

export class Facebook extends Base {
    constructor(readonly page: Page) {
        super(page, "https://www.facebook.com", "Facebook");
    }

    // Check login authentication
    checkLoginAuthentication = async () => {
        // Get all cookies
        const cookies = await this.page.context().cookies();
        const authCookie = cookies.find(cookie => cookie.name === 'c_user');
        const sessionCookie = cookies.find(cookie => cookie.name === 'xs');
        this.bang("Login button not found", !authCookie || !sessionCookie, authCookie);
    }

    // Login with credentials
    loginWithCredentials = async (email: string, password: string) => {
        // Enter email
        const emailInputField = this.page.locator('input#email[name="email"]');
        await this.pressSequentially(emailInputField, email);

        // Enter password
        const passwordInput = this.page.locator('input#pass[name="pass"]');
        await this.pressSequentially(passwordInput, password);

        // Complete login
        const submitLoginButton = this.page.locator(`button[name="login"][data-testid="royal-login-button"]`);
        this.click(submitLoginButton);
    };
}

export default async function (page: Page, url?: string) {
    const facebook = new Facebook(page);
    await facebook.navigate(url || facebook.START_URL);
    return facebook;
}