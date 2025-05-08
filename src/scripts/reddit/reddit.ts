// File: reddit.ts
import { Opts, Artifact, AI, Settings } from "../../types.js";

export const BASE_URL: string = "https://www.reddit.com";

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

//
type Scope = "Posts" | "Communities" | "Comments" | "Media" | "People";
type Sort = "Relevance" | "Hot" | "Top" | "New" | "Comments";
type Filter = "All" | "Year" | "Month" | "Week" | "Today" | "Hour";

interface Args {
  search: string[];
  scope: Scope;
  sort: Sort;
  filter: Filter;
}

interface Options extends Opts<Args> {}

export function configure(opts: Partial<Options>) {
  const settings: Settings = {
    start: {
      all: opts.settings?.start?.all || true,
      new: true,
      attempts: 9,
      feature: "reddit",
      rando: { min: 1, max: 3 },
      iterations: { min: 1, max: 1 },
      variations: { min: 1, max: 3 },
      urls: opts?.settings?.start.urls || [
        "https://www.reddit.com/r/mildlyinteresting/",
      ],
    },
    timeouts: {
      navigate: 60,
      default: 30,
      wait: 15,
      naps: {
        min: 256,
        max: 512,
        multiplier: 0,
      },
    },
  };
  const args: Args = {
    scope: "Communities",
    sort: "Relevance",
    filter: "All",
    search: ["popeye"],
  };

  const ai: AI = {
    task: "",
    decorators: {
      tone: null,
      system: "You are a Reddit bot.",
      prefix: "You are a social media copywriting guru who knows how to craft perfect replies.",
      human: "I am Reddit user.",
      audience: "reddit website users",
      background: "",
      suffix: "Please respond as creative and concisely as possible.",
    },
    generations: {
      type: "",
      terms: args.search.length > 0 ? args.search.map((data) => ({ data, type: "term", reason: "to search reddit contextually" })) : [],
      input: {
        type: "",
        data: "",
        reason: "",
      },
      range: {
        min: 0,
        max: 0,
      },
    },
  };

  const options: Options = {
    args: {
      ...args,
      ...opts.args,
    },
    ai: {
      ...ai,
      ...opts.ai,
    },
    settings: {
      start: {
        ...settings.start,
        ...opts?.settings?.start,
        urls: settings.start.all && args.search.length > 0 ? [BASE_URL, ...settings.start.urls] : settings.start.urls,
      },
      timeouts: {
        ...settings.timeouts,
        ...opts?.settings?.timeouts,
      },
    },
  };
  return options;
}

export type { Sort, Filter, Scope };
export { Artifact, Args, Options };
