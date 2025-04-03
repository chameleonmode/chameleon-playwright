import { Page } from "@playwright/test";
import Base from "../../lib/page.js";
import { random } from "../../lib/utils.js";
import { callApi } from "../../lib/ask.js";

class X extends Base {
  constructor(readonly page: Page) {
    super(page, "https://x.com");
  }

  retweetButton = () => this.page.locator(`button[data-testid="retweet"]`);
  profileButton = () => this.page.locator(`a[data-testid="AppTabBar_Profile_Link"]`);
  tweetBox = () => this.page.locator(`div[data-testid="tweetTextarea_0RichTextInputContainer"]`);
  tweetButton = () => this.page.locator(`button[data-testid="tweetButtonInline"]`);
  articles = () => this.page.locator(`main[role="main"] section article`);
  locator = (selector: string) => {
    return this.page.locator(selector)
  }

  // Check login authentication
  checkLoginAuthentication = async () => {
    try {
      // Get all cookies
      const cookies = await this.page.context().cookies();
      // check auth cookies is availble
      const authCookie = cookies.find(cookie => cookie.name === 'auth_token');
      if (authCookie) {
        console.log('isAuthenticated: ', true);
        return true;
      } else {
        console.log('isAuthenticated: ', false);
        return false;
      }
    } catch (error) {
      console.error('Error during authentication check:', error);
      return false;
    }
  };

  // Login with credentials 
  loginWithCredentials = async (email: string, userName: string, password: string) => {
    console.log('login proccess started...');
    const selector = "a[data-testid='loginButton']";
    const loginAnchor = this.page.locator(selector);
    await loginAnchor.waitFor({ state: 'visible' });
    const isLoginBtn = await loginAnchor.isVisible();

    if (isLoginBtn) {
      loginAnchor.click();
      const emailInput = this.page.locator('input[autocomplete="username"]');
      await emailInput.type(email, { delay: random(50, 100) });
      const emailNextButton = 'button:has-text("Next")';
      await this.page.waitForSelector(emailNextButton);
      await this.page.click(emailNextButton);

      const userNameInput = this.page.locator('input[data-testid="ocfEnterTextTextInput"]');
      if(userNameInput){
        await userNameInput.type(userName, { delay: random(50, 100) });
        const userNameNextButton = 'button[data-testid="ocfEnterTextNextButton"]';
        await this.page.waitForSelector(userNameNextButton);
        await this.page.click(userNameNextButton);
      }

      const passwordInput = this.page.locator('input[name="password"]');
      await passwordInput.type(password, { delay: random(50, 100) });
      const loginButton = 'button[data-testid="LoginForm_Login_Button"]';
      await this.page.waitForSelector(loginButton);
      await this.page.click(loginButton);
      return true;
    }
  }

  // Login with goole
  loginWithGoogle = async (email: string, password: string) => {
    console.log('login proccess started...');
    const googleIframeSelector = 'iframe[title="Sign in with Google Button"]';
    await this.page.waitForSelector(googleIframeSelector, { state: "visible" });
    const googleButton = await this.page.locator(googleIframeSelector);
    await googleButton.click();

    const waitForOpenPopup = this.page.waitForEvent("popup");
    const popupDetailFilleds = await waitForOpenPopup;
    await popupDetailFilleds.waitForLoadState();

    const emailButtons = popupDetailFilleds.locator('div[data-identifier] div[data-email]');
    const emailCount = await emailButtons.count();
    if (emailCount > 0) {
      await emailButtons.first().click();
    } else {
      const emailInput = popupDetailFilleds.getByLabel("Email or phone");
      await emailInput.waitFor({ state: "visible" });
      let isEmailValueEmpty = await emailInput.inputValue();

      const googleLoginNextButton = popupDetailFilleds.locator('div#identifierNext button');
      await googleLoginNextButton.waitFor({ state: 'visible' });

      if (!isEmailValueEmpty) {
        console.log('email not found!');
        await emailInput.type(email, { delay: random(50, 100) });
        await googleLoginNextButton.click();

        const passwordInput = popupDetailFilleds.getByLabel("Enter your password");
        await passwordInput.waitFor({ state: 'visible' });
        await passwordInput.type(password, { delay: random(50, 100) });

        const googleLoginPassNextButton = popupDetailFilleds.locator('div#passwordNext button');
        await googleLoginPassNextButton.waitFor({ state: 'visible' });
        await googleLoginPassNextButton.click();
      } else {
        await googleLoginNextButton.click();
      }
    }
  }
  // Love Tweet
  loveTweet = async () => {
    try {
      const isAlreadyLiked = this.page.locator('div[aria-label*="Timeline"] div[data-testid="cellInnerDiv"]:first-child button[data-testid="unlike"]');
      const isAvailable = await isAlreadyLiked.count() > 0;

      if (!isAvailable) {
        const likeButton = this.page.locator('div[aria-label*="Timeline"] div[data-testid="cellInnerDiv"]:first-child button[data-testid="like"]').first();

        await likeButton.scrollIntoViewIfNeeded();
        await likeButton.click();
        console.log("Button clicked: Liked!");

      } else {
        await isAlreadyLiked.scrollIntoViewIfNeeded();
        console.log("Already liked");
      }
    } catch (error) {
      console.error("Error in loveTweet function:", error);
    }
  }

  // tweet to X
  tweetToX = async (tweet: string) => {
    await this.tweetBox().waitFor();
    await this.tweetBox().click();
    await this.tweetBox().pressSequentially(tweet, { delay: random(128, 256) });
    await this.tweetButton().first().click();
  }

  // Search for a keyword on X
  async search(keyword: string) {
    console.log(`Starting search for keyword: "${keyword}"`);
    
    console.log("Navigating to X's explore page...");
    await this.page.goto("https://x.com/explore");
    
    console.log("Locating search input field...");
    const searchInput = this.page.locator('input[placeholder="Search"]');
    
    console.log(`Entering search keyword: "${keyword}"`);
    await searchInput.fill(keyword);
    
    console.log("Submitting search...");
    await searchInput.press("Enter");
    
    console.log("Waiting for search results to load...");
    await this.page.waitForLoadState("domcontentloaded");
    
    console.log("Search completed successfully");
    // Wait for 3 seconds before closing the page
    // await this.page.waitForTimeout(5000);

    // await this.page.close();
}

  // Open the first profile matching the keyword
  async openFirstProfile(keyword: string, timeout: number = 50000) {
    // Convert keyword to lowercase for case-insensitive matching
    const normalizedKeyword = keyword.toLowerCase();
    
    try {
        console.log(`Searching for profile matching: "${keyword}"`);
        
        // Wait for any profile link that contains the keyword (case-insensitive)
        await this.page.waitForSelector(`a[href*="/${normalizedKeyword}" i]`, {
            state: 'attached',
            timeout: timeout
        });

        // Find the first matching profile (case-insensitive)
        const profile = this.page.locator(`a[href*="/${normalizedKeyword}" i]`).first();
        
        console.log(`Found matching profile, scrolling into view...`);
        await profile.scrollIntoViewIfNeeded();
        
        console.log(`Opening profile...`);
        await Promise.all([
            this.page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
            profile.click()
        ]);
        
        console.log(`Successfully opened profile matching: "${keyword}"`);
        
    } catch (error) {
        console.error(`Failed to open profile with keyword "${keyword}": ${error}`);
        throw new Error(`No profile found matching "${keyword}" (case-insensitive)`);
    }
  }

  // Retweet the top most relevant tweet
  async retweetTopTweet() {
    try {
      console.log("Attempting to retweet the top tweet...");
      
      // Step 1: Click the retweet button
      const retweetButton = this.retweetButton().first();
      await retweetButton.click();
      console.log("Retweet button clicked successfully.");
  
      // Step 2: Wait for and click the confirmation button
      const confirmReTweetSelector = 'div[data-testid="retweetConfirm"]';
      await this.page.waitForSelector(confirmReTweetSelector, { timeout: 5000 });
      const confirmButton = this.page.locator(confirmReTweetSelector);
      await confirmButton.click();
      console.log("Retweet confirmed successfully.");
  
      // Step 3: Close the page
      await this.page.waitForTimeout(5000);
      await this.page.close();
      console.log("Page closed successfully.");
  
    } catch (error) {
      console.error("Error during retweet process:", error);
  
      // Attempt to close the page even if an error occurs
      try {
        await this.page.close();
        console.log("Page closed after encountering an error.");
      } catch (error) {
        console.error("Failed to close the page:", error);
      }
  
      // Re-throw the error if needed for test failure reporting
      throw error;
    }
  }

  // search keyword on post and reply
  async searchKeyWordOnPost(keyword: string): Promise<void> {
    await this.articles().first().waitFor();

    const allArticles = await this.articles().all();
    await Promise.all(allArticles.map(article => article.waitFor({ state: 'visible' })));
    const visibleArticles = allArticles.slice(0, 5);
    let found = false;

    for (const article of visibleArticles) {
      const articleText: string | null = await article.textContent();
      if (articleText && articleText.includes(keyword)) {
        console.log(`Keyword :- "${keyword}" found in article :-`, articleText);
        await article.scrollIntoViewIfNeeded();
        found = true;
        
        const replyBtn = article.locator('button[data-testid="reply"]');
        try {
          console.log('Please wait for reply on comment!');
          // Call Api for get reply comment
          const replyedText = await callApi(articleText);
          if (replyedText) {
            replyBtn.click();
            // Reply on search keyword
            await this.replyOnPost(replyedText);
          } else {
            console.log('Replyed text not found!');
          }
        } catch (error) {
          console.log(error, '---errror--');
        }
        break;
      }
    }
    if (!found) {
      console.log(`Keyword "${keyword}" not found in any article.`);
    }
  }

  // Reply on post 
  async replyOnPost(replyText: string): Promise<void> {
    const replySelector = 'div[data-viewportview="true"] div.DraftEditor-editorContainer';
    await this.page.waitForSelector(replySelector, { state: 'visible' });
    await this.type(replyText);

    const replyBtnSelector = 'div[data-testid="toolBar"] button[data-testid="tweetButton"]';
    let replyBtn = this.page.locator(replyBtnSelector);
    replyBtn.waitFor();
    replyBtn.click();
    console.log('Successfully replyed on comment');
  }
}

export default X;