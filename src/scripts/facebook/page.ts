import { Locator, Page } from "@playwright/test";
import Base from "../page.js";
import { rando } from "../../lib/utils.js";

export class Facebook extends Base {
    constructor(readonly page: Page) {
        super(page, "https://www.facebook.com", "Facebook");
    }
    searchInput = () => this.page.locator('input[placeholder="Search Facebook"]');
    selectFeed = () => this.page.locator('div[role="feed"] div[data-virtualized]');
    postFeed = () => this.page.locator('div[role="main"][aria-label="Search results"]');
    shareButton = () => this.page.locator('div[role="main"][aria-label="Search results"] div[aria-label="Send this to friends or post it on your profile."][role="button"]');
    replyButton = () => this.page.locator('div[role="main"][aria-label="Search results"] div[aria-label="Leave a comment"]');
    replyBtnSelector = () => this.page.locator('div[aria-label="Comment"]');
    resultsContainer = () => this.page.locator('div[role="main"][aria-label="Search results"]');
    shareNowButtonSelector = () => this.page.locator('div[aria-label="Share now"]');
    replyBoxSelector = () => this.page.locator('div[aria-label="Write a comment…"]');
    replycommentButton = () => this.page.locator('div[aria-label="Comment"]');
    postOuter = () => this.page.locator('div[role="feed"] div[data-virtualized]');
    locator = (selector: string) => {
        return this.page.locator(selector)
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
    // Search for a keyword on Facebook
    async search(keyword: string) {
        await this.pressSequentially(this.searchInput(), keyword);
        await this.searchInput().press("Enter");
    }

    // Click on the share button of the top most relevant post in the search results
    async sharePost() {
        await this.bang("Search results container not visible", this.resultsContainer().isVisible(), this.resultsContainer());
        await this.shareButton().first().waitFor({ state: "visible" })
        const buttonAvailable = await this.shareButton().first().count();
        if (buttonAvailable > 0) {
            await this.shareButton().first().scrollIntoViewIfNeeded();
            await this.click(this.shareButton().first());
            await this.bang("Reply box not found", this.shareNowButtonSelector().isVisible(), this.shareNowButtonSelector());
            await this.click(this.shareNowButtonSelector());
        }
    }

    // Check the posts from search with keyword
    async getPost(nth = 1, random = Math.random() < 0.5) {
        const post = await this.bang("Search results not found", this.postFeed(), this.postFeed());  // Use the Locator here
        const replyButton = await this.bang(
            "Reply button not found",
            random
                ? this.replyButton().nth(Math.floor(Math.random() * (await this.replyButton().count())))
                : this.replyButton().nth(nth),
            this.replyButton()
        );
        await this.bang("Failed to click reply button", replyButton.click(), replyButton);
        const postContent = this.locator('div[role="main"][aria-label="Search results"] div[data-ad-comet-preview="message"]').first();
        // await postContent.scrollIntoViewIfNeeded();
        return {
            text: await postContent.innerText(),
            locator: post,
        };
    }

    // Reply to the post on Facebook
    async replyToPost(locator: Locator, reply: string) {
        await this.bang("Reply box not found", this.replyBoxSelector().isVisible(), this.replyBoxSelector());
        await this.click(this.replyBoxSelector());
        await this.pressSequentially(this.replyBoxSelector(), reply);
        await this.click(this.replycommentButton());
    }

    // Love Facebook Post
    lovePostFaceook = async () => {
        await this.scrollabit();
        const count = rando(await this.postOuter().count());
        for (let i = 0; i <= count; i++) {
            const currentPost = this.postOuter().nth(i);
            await currentPost.scrollIntoViewIfNeeded();
            const likedPosts = currentPost.locator('div[aria-label="Remove Love"][role="button"]');
            if (await likedPosts.count() > 0) {
                await this.click(this.bang("'Unlike' button not found", likedPosts));
                continue;
            }
            await currentPost.locator('div[aria-label="Like"][role="button"]').hover();
            await this.click(this.bang("'Love' button not found", this.page.locator('div[aria-label=\"Love\"]')));
        }
    }

    // create post on facebook
    createPostFaceook = async (postText: string) => {
        await this.click(this.bang("'Create Post' not found", this.page.locator('div[aria-label="Create a post"][role="region"] div[role="button"]').first()));
        await this.pressSequentially(this.page.locator(`div[contenteditable="true"][role="textbox"]`), postText);
        await this.click(this.bang("'Post' button not found", this.page.locator('div[aria-label="Post"][role="button"]').first()));
    }
}

export default async function (page: Page, url?: string) {
    const facebook = new Facebook(page);
    await facebook.navigate(url || facebook.START_URL);
    return facebook;
}