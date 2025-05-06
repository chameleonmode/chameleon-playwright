// File: src/scrapers/post-scraper.ts
import { Page } from "playwright";
import { Article, Artifact, Post, Comment, SELECTORS } from "../reddit.js";
import { Logger } from "../../../lib/logger.js";


/**
 * Scrapes a Reddit post and extracts all data
 * @param page - Playwright page (on post details page)
 * @returns Post object with all data
 */
export async function post(page: Page): Promise<Post> {
  const extract = async (selector: string) => {
    return await page.$eval(selector, (el) => {
      interface ElementalNode {
        attributes: Record<string, any>;
        elementals: ElementalNode[] | undefined;
      }
      const attribution = (el: Element) => {
        const attributes = Array.from(el.attributes).reduce((acc, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {} as Record<string, any>);
        return {
          attributes,
          tag: el.tagName,
          text: el.textContent?.trim().replace(/\n/g, "").replace(/ +/g, " "),
        };
      };
      const elementals = (children: HTMLCollection): ElementalNode[] => {
        return Array.from(children).map((child): ElementalNode => elemental(child));
      };
      const elemental = (el: Element): ElementalNode => {
        return {
          attributes: attribution(el),
          elementals: elementals(el.children),
        };
      };


      // Usage
      const artifact: Artifact = {
        elemental: elemental(el),

        // outer: el.outerHTML.replace(/\n/g, "").replace(/ +/g, " "),
        // inner: el.innerHTML.replace(/\n/g, "").replace(/ +/g, " "),
      };
      return artifact;
    });
  };
  // Extract basic post data
  // Extract post components efficiently
  const [container] =
    await Promise.all([
      extract(SELECTORS.post.container),
    ]);

  // Extract comments and comment section
  const comments = await page.$$eval(
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
  );

  // Create the complete post object
  const post: Post = {
    container,
    comments,
  };

  Logger.info(`Successfully scraped post:`, post, post.container, comments);
  return post;
}


export async function articles(page: Page): Promise<Article[]> {
  const feed = await page.$$(SELECTORS.subreddit.feed);
  const articles = await Promise.all(
    feed.map(async (post) => {
      return await page.evaluate((post) => {
        // Basic post data structure
        const article: Article = {
          postType: "unknown",
        };

        // Extract data from shreddit-post attributes
        const shredditPost = post.querySelector("shreddit-post");
        if (shredditPost) {
          const getAttr = (attr: string) => shredditPost.getAttribute(attr) || "";

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
          else if (postType === "self") article.postType = "text";
        }

        // Title
        const titleElement = post.querySelector('a[id^="post-title-"], [slot="title"]');
        article.title = titleElement?.textContent?.trim() || "";

        // Author (fallback)
        const authorElement = post.querySelector('[slot="authorName"] a, .advertiser-name');
        if (authorElement) {
          article.author = authorElement.textContent?.trim().replace(/^u\//, "") || article.author;
        }

        // Flair
        const flairElement = post.querySelector('[slot="post-flair"] .flair-content');
        article.flair = flairElement?.textContent?.trim() || "";
        
        // Images
        if (article.postType === "image" || article.postType === "video") {
          const mediaImg = post.querySelector("img.preview-image, img.preview-img, img.media-lightbox-img");
          article.image = mediaImg?.getAttribute("src") || "";
        }

        // Thumbnail
        const thumbnailImg = post.querySelector('[slot="thumbnail"] img, .thumbnail img');
        article.thumbnail = thumbnailImg?.getAttribute("src") || "";

        return article;
      }, post);
    })
  );
  return articles.filter((article) => {
    // Filter out posts with no title or permalink
    return article.title && article.permalink && article.postType !== "unknown";
  });
}
