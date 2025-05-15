// File: reddit.ts
import { Logger } from "../../lib/logger.js";
import { Opts, Artifact, AI, Settings } from "../../lib/types/index.js";

export const BASE_URL: string = "https://www.reddit.com";

//
type Scope = "Posts" | "Communities" | "Comments" | "Media" | "People";
type Sort = "Relevance" | "Hot" | "Top" | "New" | "Comments";
type Filter = "All" | "Year" | "Month" | "Week" | "Today" | "Hour";

interface Args {
  search: string[];
  scope: Scope;
  sort: Sort;
  filter: Filter;
  artifacters: Artifact[];
}

interface Options extends Opts<Args> {
}

export function configure(opts?: Partial<Options>) {
  const settings: Settings = {
    start: {
      all: opts?.settings?.start?.all || true,
      new: true,
      attempts: 9,
      feature: opts?.settings?.start?.feature || "reddit",
      rando: { min: 1, max: 1 },
      iterations: { min: 1, max: 1 },
      variations: { min: 1, max: 1 },
      urls: opts?.settings?.start.urls || []
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
    artifacters: [
      {
        type: "selections",
        data: ["vote"],
      },
    ],
    ...opts?.args,
  };

  const ai: AI = {
    task: "",
    decorators: {
      tone: opts?.ai?.decorators.tone || null,
      system: opts?.ai?.decorators.system || "You are a helpful reddit assistant.",
      prefix:opts?.ai?.decorators.prefix || "As a social media expert you know how to make perfect decisions so consider the following:",
      human: opts?.ai?.decorators.human || "I am a reddit content creator, who creates interesting content",
      audience: opts?.ai?.decorators.audience || "The target audience are reddit website users",
      background: opts?.ai?.decorators.background || "I currently am on reddit.com and looking for content",
      suffix: opts?.ai?.decorators.suffix || "Respond as creative as possible.",
    },
    generations: {
      terms: args.search.length > 0 ? args.search.map((data) => ({ data, type: "term", reason: "to search reddit contextually" })) : [],
      sys: "",
      type: "",
      context: "",
      range: {
        min: 0,
        max: 0,
      },
      input: {
        type: "",
        data: "",
        reason: "",
      },
    },
  };

  const options: Options = {
    args,
    ai,
    run: {
      file: "reddit",
      port: 3000,
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
