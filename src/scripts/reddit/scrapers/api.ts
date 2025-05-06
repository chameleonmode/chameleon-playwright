import { Page } from "playwright";
import { Article, SELECTORS } from "../reddit";
import { Logger } from "../../../lib/logger";
import { post, articles } from "./articles";
import * as fs from "fs";

/**
 * Navigates to a Reddit post using multiple fallback strategies
 * @param page - Playwright page
 * @param permalink - Post permalink (e.g., /r/subreddit/comments/id/title/)
 * @returns Promise resolving to true if navigation was successful
 */
async function navigateToPost(page: Page, permalink: string) {
  const postUrl = `https://www.reddit.com${permalink}`;
  const postPermalink = new URL(postUrl).pathname;
  Logger.info(`Attempting to navigate to post: ${postPermalink}`);

  const safele = async (selector: string) => {
    const elements = await page.$$(selector);

    for (const element of elements) {
      // Check if element is inside a media container
      const isInsideMedia = await element.evaluate((el) => {
        // Media container identifiers
        const mediaIdentifiers = [
          (el: Element) => el.tagName.toLowerCase().includes("player"),
          (el: Element) => el.tagName.toLowerCase() === "video",
          (el: Element) => el.tagName.toLowerCase() === "iframe",
          (el: Element) => el.getAttribute("slot") === "post-media-container",
          (el: Element) => el.classList.contains("media-container"),
          // Additional checks for shreddit-player elements and their attributes
          (el: Element) => el.tagName.toLowerCase().includes("shreddit-player"),
          (el: Element) => el.hasAttribute("autoplay"),
          (el: Element) => el.hasAttribute("post-type"),
          (el: Element) => el.hasAttribute("preview"),
          (el: Element) => el.hasAttribute("data-post-click-location"),
          (el: Element) => el.hasAttribute("caption-url"),
          (el: Element) => el.classList.contains("pointer-cursor"),
          // Check for attributes in parent elements
          (el: Element) => {
            const parent = el.parentElement;
            return (
              parent &&
              (parent.classList.contains("relative") ||
                parent.classList.contains("overflow-hidden") ||
                parent.classList.contains("pointer-cursor") ||
                parent.classList.contains("isolate") ||
                parent.getAttribute("slot") === "post-media-container")
            );
          },
        ];

        // Walk up DOM tree to check for media containers
        let current = el;
        while (current) {
          if (mediaIdentifiers.some((check) => check(current))) {
            return true;
          }
          const parent = current.parentElement;
          if (!parent) break;
          current = parent;
        }
        return false;
      });

      if (!isInsideMedia) {
        Logger.info(`Found safe clickable element: ${selector}`);
        await element.click({ force: true });
        return true;
      }
    }

    Logger.info(`No safe clickable elements found for: ${selector}`);
    return false;
  };

  // Define navigation strategies in priority order
  const strategies = [
    {
      name: "direct",
      fn: async () => {
        Logger.info("Using direct navigation");
        await page.goto(postUrl, { waitUntil: "load", timeout: 30000 });
        return true;
      },
    },
    { name: "title", fn: () => safele(SELECTORS.subreddit.titleLink) },
    {
      name: "permalink",
      fn: () => safele(`a[href="${postPermalink}"], a[href*="${postPermalink}"]`),
    },
    { name: "comments", fn: () => safele(SELECTORS.subreddit.commentLink) },
    {
      name: "js-redirect",
      fn: async () => {
        Logger.info("Using JavaScript navigation");
        await page.evaluate((url) => {
          window.location.href = url;
        }, postUrl);
        await page.waitForLoadState("load");
        return true;
      },
    },
  ];
  return strategies;
}

/**
 * Scrapes visible posts from a subreddit
 * @param page - Playwright page
 * @param subredditName - Subreddit name without r/ prefix
 * @param maxPosts - Maximum number of posts to scrape (default 5)
 * @returns Array of Article objects
 */
export async function scrapeSubreddit(page: Page, maxPosts: number = 5): Promise<Article[]> {
  await page.waitForSelector(SELECTORS.subreddit.feed, { timeout: 30000 });
  await page.waitForTimeout(1000);

  // Extract initial posts data

  const feed = await articles(page);
  for (let i = 0; i < Math.min(feed.length, maxPosts); i++) {
    const article = feed[i];
    const currentUrl = page.url();
    const back = async() =>{
      while (page.url() !== currentUrl) {
        await page.goBack({ waitUntil: "domcontentloaded" });
        await page.waitForTimeout(1000);
      }
    }
    try {
      // Try each strategy sequentially
      for (const { name, fn } of await navigateToPost(page, article.permalink!)) {
        Logger.info(`Trying navigation strategy: ${name}`);
        if (await fn()) {
          await page.waitForLoadState("load");
          await page.waitForTimeout(1000);

          const currentUrl = page.url();
          if (currentUrl.includes(article.permalink!)) {
            Logger.info(`Successfully navigated to post via ${name} strategy`);
            article.post = await post(page);
            break;
          } else {
            Logger.warn(`Failed to navigate to post via ${name} strategy`);
            await back();
          }
        }
      }

      Logger.info(`Scraped post data for ${article.title}`, article);
    } catch (error) {
      Logger.warn(`Error navigating to post: ${error}`, error);
      // remove the article from the list
      feed.splice(i, 1);
      i--;
    } finally {
      // Return to subreddit page
      Logger.info("Returning to subreddit page");
      await back();
    }
  }

  const outputPath = `.cache/scraper/./feed.json`;
  fs.writeFileSync(outputPath, JSON.stringify(feed, null, 2));
  return feed;
}
