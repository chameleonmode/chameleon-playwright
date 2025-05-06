import { Browser, chromium } from "@playwright/test";
import { Logger } from "../../src/lib/logger";
import { scrapeSubreddit } from "../../src/scripts/reddit/scrapers/api";
import * as fs from "fs";

/**
 * Configuration for the Reddit scraper
 */
interface ScraperConfig {
  headless: boolean;
  subreddit: string;
  maxPosts: number;
  outputFile: string;
  userAgent?: string;
  executablePath?: string;
}

/**
 * Main function to run the Reddit scraper
 * @param config - Scraper configuration
 */
export async function runRedditScraper(config: ScraperConfig): Promise<void> {
  let browser: Browser | null = null;

  try {
    // Configure and launch browser
    browser = await chromium.launch({
      headless: config.headless,
      executablePath: config.executablePath,
    });

    const context = await browser.newContext({
      userAgent:
        config.userAgent ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      viewport: { width: 1280, height: 800 },
    });

    // Add stealth features to avoid detection
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });

      // Add more stealth features as needed
      const originalQuery = window.navigator.permissions.query;
      // @ts-ignore
      window.navigator.permissions.query = (parameters) => {
        parameters.name === "notifications"
          ? Promise.resolve({ state: Notification.permission })
          : originalQuery(parameters);
      };
    });

    const page = await context.newPage();

    // Run the scraper
    Logger.info(`Starting Reddit scraper for r/${config.subreddit}`);
    // Navigate and wait for content
    const url = `https://www.reddit.com/r/${config.subreddit}/`;
    Logger.info(`Starting to scrape: ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded" });
    const posts = await scrapeSubreddit(page, config.maxPosts);

    Logger.info(`Scraped ${posts.length} posts`, posts);
  } catch (error) {
    Logger.error("Scraper failed", error);
    throw error;
  } finally {
    // Always close browser
    if (browser) {
      await browser.close();
      Logger.info("Browser closed");
    }
  }
}

// Example showing how to use this with your own Playwright instance
async function example() {
  runRedditScraper({
    headless: true,
    subreddit: "law",
    maxPosts: 5,
    outputFile: ".cache/scraper/./law_posts.json",
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  })
    .then(() => Logger.info("Scraper completed successfully"))
    .catch((error) => {
      Logger.error("Scraper failed with error", error);
      process.exit(1);
    });
  //   // Create your own browser and page instances
  //   const browser = await chromium.launch({
  //     headless: true,
  //     executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  //   });
  //   const context = await browser.newContext({
  //     userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  //     viewport: { width: 1280, height: 800 }
  //   });

  //   // Add stealth plugin to avoid detection
  //   await context.addInitScript(() => {
  //     Object.defineProperty(navigator, 'webdriver', { get: () => false });
  //   });

  //   const page = await context.newPage();

  //   try {
  //     // Use the scraper method
  //     const posts = await scrappy(page, 'law');

  //     console.log(`Scraped ${posts.length} posts from r/law`);

  //     // Save to a file
  //     console.log('Posts saved to law_posts.json', JSON.stringify(posts, null, 2));
  //   } catch (error) {
  //     console.error('Error:', error instanceof Error ? error.message : String(error));
  //   } finally {
  //     await browser.close();
  //   }
}
example();
// This example demonstrates how to use the scrapeSubreddit function directly
