import { Page } from "playwright";
import { Logger } from "../../../lib/logger";
import { post, articles, Article } from "./articles";
import * as fs from "fs";
export const SELECTORS = {
  post: {
    container: 'shreddit-post, .Post, [data-testid="post-container"]',
    title: 'h1[slot="title"], h1[id^="post-title-"], .post-title',
    creditBar: '[slot="credit-bar"], .post-meta-info, [data-testid="post-metadata"]',
    subredditLink: 'a[href^="/r/"], .subreddit-link',
    subredditName: 'a.subreddit-name, [data-testid="subreddit-name"], a[href^="/r/"]',
    // flair: '[slot="post-flair"], .post-flair, .flair',
    mediaContainer: '[slot="post-media-container"], .media-container, [data-testid="post-media"]',
    externalLink:
      'a[href^="http"]:not([href*="reddit.com"]), .external-link, [data-testid="external-link"]',
    commentSection:
      'faceplate-partial[name^="TopComments_"], .comments-container, [data-testid="comments-section"]',
    // sidebarRules: '.rules-section, [data-testid="rules-section"]',
    // moderators: '.moderators-section, [data-testid="moderators-section"]',
  },
  comment: {
    container: '.Comment, shreddit-comment, [data-testid="comment"]',
    author: 'a.author-name, [slot="authorName"] a, [data-testid="comment_author"]',
    flair: '.AuthorFlair, [slot="authorFlair"], .comment-author-flair',
    score: '.score, [slot="score"], [data-test-id="comment-upvotes"], .icon-upvote + span',
    timestamp: 'faceplate-timeago, time, [data-testid="comment_timestamp"]',
    content: '.md, .RichTextJSON-root, [data-testid="comment-content"], .comment-content',
    actions: '.comment-actions, [slot="actions"], .action-buttons',
    replies: '.replies, .children, [slot="replies"]',
    awards: '.comment-awards, [slot="awards"]',
    distinguished: '.distinguished, [data-testid="distinguished-text"]',
    collapsed: '.collapsed, [data-testid="collapsed-comment"]',
  },
  subreddit: {
    feed: "shreddit-feed article",
    postTitle: 'a[slot="title"], a[id^="post-title-"], [slot="title"]',
    authorName: '[slot="authorName"] a, .advertiser-name',
    flair: '[slot="post-flair"] .flair-content',
    mediaImage: "img.preview-image, img.preview-img, img.media-lightbox-img",
    thumbnail: '[slot="thumbnail"] img, .thumbnail img',
    commentLink: [
      'a[data-testid="comment-link"]',
      'a[data-click-id="comments"]',
      'span:has-text("comments")',
      'a:has-text("comments")',
      '[slot="comments-button"]',
    ].join(", "),
    titleLink: 'h1 a, h3 a, a[data-click-id="body"]',
  },
};
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
  for (let i = 0; i < 3; i++) {
    // Scroll down to load more articles
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight);
    });
    
    // Wait for potential new content to load
    await page.waitForTimeout(1000);
  }
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
