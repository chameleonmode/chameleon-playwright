// File: src/scrapers/post-scraper.ts
import { Page } from "playwright";
import { Logger } from "../../../lib/logger.js";
import { SELECTORS } from "./api.js";



export interface Article {
  postType: "text" | "image" | "video" | "link" | "unknown";
  id?: string;
  title?: string;
  author?: string;
  authorId?: string;
  created?: string;
  score?: string;
  comments?: string;
  flair?: string;
  permalink?: string;
  url?: string;
  domain?: string;
  thumbnail?: string | null;
  image?: string | null;
  post?: Post;
}

export interface Attribution {
  tag: string;
  text: string | undefined;
  attributes: Record<string, string>;
}

export interface ElementalNode {
  attributes: Attribution;
  elementals: ElementalNode[];
}

// Type definitions for Post
export interface Post {
  container?: ElementalNode;
  comments?: Comment[];
}

// Comment interface represents an individual comment
export interface Comment {
  author: string;
  score: number;
  timestamp: string;
  text: string;
  depth: number;
}

/**
 * Scrapes a Reddit post and extracts all data
 * @param page - Playwright page (on post details page)
 * @returns Post object with all data
 */
export async function post(page: Page): Promise<Post> {
  const extract = async (selector: string) => {
    return await page.$eval(selector, (el) => {
      // Extract elemental data similar to post function
      const attribution = (el: Element) => {
        const attributes = Array.from(el.attributes).reduce((acc: Record<string, string>, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {});
        return {
          attributes,
          tag: el.tagName,
          text: el.textContent?.trim().replace(/\n/g, "").replace(/ +/g, " "),
        };
      };

      // Create an artifact similar to the post function
      const elemental = (el: Element): ElementalNode => {
        return {
          attributes: attribution(el),
          elementals: Array.from(el.children).map((child) => elemental(child)),
        };
      };
      // Usage
      return {
        ...elemental(el),

        // outer: el.outerHTML.replace(/\n/g, "").replace(/ +/g, " "),
        // inner: el.innerHTML.replace(/\n/g, "").replace(/ +/g, " "),
      };
    });
  };
  // Extract post components efficiently
  const [container] = await Promise.all([extract(SELECTORS.post.container)]);

  // Extract comments and comment section;

  // Create the complete post object
  const post: Post = {
    container,
    comments: await page.$$eval(
      SELECTORS.comment.container,
      (elements: Element[], selectors) => {
        return elements.map((ele) => {
          // Comment container
          // const commentContainer = ele.outerHTML;

          // Comment author - check attribute first, then fallback to element
          const author =
            ele.getAttribute("author") || ele.querySelector(selectors.author)?.textContent?.trim() || "";

          // Author flair

          // Comment score - check attribute first, then fallback to element
          const scoreAttr = ele.getAttribute("score");
          const scoreElement = ele.querySelector(selectors.score);
          const scoreText = scoreAttr || scoreElement?.textContent?.trim() || "0";
          const score = /\d+/.test(scoreText) ? parseInt(scoreText, 10) : 0;

          // Timestamp - check attribute first, then fallback to element
          const timestampAttr = ele.getAttribute("ts") || ele.querySelector("[ts]")?.getAttribute("ts");
          const timeElement = ele.querySelector(selectors.timestamp);
          const timestamp =
            timestampAttr ||
            (timeElement
              ? timeElement.getAttribute("ts") ||
                timeElement.getAttribute("datetime") ||
                timeElement?.textContent?.trim() ||
                ""
              : "");

          // Comment content - look for the content element with id pattern
          const contentId = ele.getAttribute("thingid");
          const contentElement = contentId
            ? ele.querySelector(`#${contentId}-post-rtjson-content`) || ele.querySelector(selectors.content)
            : ele.querySelector(selectors.content);
          const content = contentElement?.outerHTML.replace(/\n/g, "").replace(/ +/g, " ") || "";
          const text = contentElement?.textContent?.trim().replace(/\n/g, "").replace(/ +/g, " ") || "";

          // Comment actions

          // Child comments/replies - check slot pattern for newer Reddit

          // Comment depth - check attribute first, then fallback
          const depthAttr = ele.getAttribute("depth");
          const depthAttributes = depthAttr ? ["depth"] : ["depth", "data-depth", "comment-depth"];
          const dataDepth =
            depthAttr ||
            depthAttributes.map((attr) => ele.getAttribute(attr)).find((val) => val !== null) ||
            "0";
          const depth = parseInt(dataDepth, 10) || 0;

          // Comment awards - check attribute first

          // Distinguished status - check attribute

          // Collapsed state - check attribute first
          return {
            // container: commentContainer,
            // content,
            author,
            score,
            timestamp,
            depth,
            text,
          };
        });
      },
      SELECTORS.comment
    ),
  };

  Logger.info(`Successfully scraped post:`, post, post.container,post.container?.attributes, post.container?.elementals, post.comments);
  return post;
}

export async function articles(page: Page): Promise<Article[]> {
  // Use the same approach as in post function to extract articles
  // Instead of processing each article individually, we'll extract all articles at once
  const articles = await page.$$eval(
    SELECTORS.subreddit.feed,
    (elements, selectors) => {
      return elements.map((post) => {
        // Basic post data structure
        const article: Article = {
          postType: "unknown",
        };

        // Extract data from shreddit-post attributes
        const shredditPost = post.querySelector("shreddit-post");
        if (shredditPost) {
          const getAttr = (attr: string) => shredditPost.getAttribute(attr) || undefined;

          article.id = getAttr("id");
          article.permalink = getAttr("permalink");
          article.url = getAttr("content-href");
          article.domain = getAttr("domain");
          article.author = getAttr("author");
          article.authorId = getAttr("author-id");
          article.created = getAttr("created-timestamp");
          article.score = getAttr("score") || "0";
          article.comments = getAttr("comment-count") || "0";

          // Post type
          const postType = getAttr("post-type");
          if (postType === "video") article.postType = "video";
          else if (postType === "image") article.postType = "image";
          else if (postType === "link") article.postType = "link";
          else if (postType === "text") article.postType = "text";
          else {
            // Fallback post type detection
            if (post.querySelector('shreddit-player-2, video, [data-test-id="video-player"]')) {
              article.postType = "video";
            } else if (post.querySelector('img.preview-img, img.media-lightbox-img, [data-test-id="post-image"]')) {
              article.postType = "image";
            } else if (post.querySelector('a.post-link, [data-testid="outbound-link"]')) {
              article.postType = "link";
            } else {
              article.postType = "text";
            }
          }
        }

        // Author (fallback) - using selector from SELECTORS
        if (!article.author) {
          const authorElement = post.querySelector(selectors.authorName);
          article.author = authorElement?.textContent?.trim().replace(/^u\//, "") || "";
          
          // Try to extract author ID if possible
          if (authorElement) {
            const href = authorElement.getAttribute('href');
            if (href) {
              article.authorId = href.split('/').filter(Boolean).pop() || '';
            }
          }
        }

        // Title - using selector from SELECTORS
        const titleElement = post.querySelector(selectors.postTitle);
        article.title = titleElement?.textContent?.trim() || "";

        // URL (fallback)
        if (!article.url && titleElement) {
          article.url = titleElement.getAttribute('href') || "";
        }

        // Permalink (fallback)
        if (!article.permalink) {
          const permalinkElement = post.querySelector(selectors.titleLink);
          article.permalink = permalinkElement?.getAttribute('href') || "";
        }

        // Score and comment count (fallback)
        if (!article.score) {
          const scoreElement = post.querySelector('[data-testid="post-score"], [data-test-id="post-score"]');
          article.score = scoreElement ? scoreElement.textContent?.trim() || "0" : "0";
        }

        if (!article.comments) {
          const commentCountElement = post.querySelector('[data-test-id="comment-count"], [data-testid="comment-count"]');
          article.comments = commentCountElement ? commentCountElement.textContent?.trim() || "0" : "0";
        }

        return article;
      });
    },
    SELECTORS.subreddit
  );

  // Filter out invalid articles
  const validArticles = articles.filter((article) => {
    return article.title && article.permalink && article.postType !== "unknown";
  });

  Logger.info(`Successfully scraped ${validArticles.length} articles`);
  return validArticles;
}
