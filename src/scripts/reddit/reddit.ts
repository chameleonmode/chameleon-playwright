// File: reddit.ts
import { AI, Opts, Artifact, Settings } from "../../types/index.js";

export const BASE_URL: string = "https://www.reddit.com";

//
export type Scope = "Posts" | "Communities" | "Comments" | "Media" | "People";
export type Sort = "Relevance" | "Hot" | "Top" | "New" | "Comments";
export type Filter = "All" | "Year" | "Month" | "Week" | "Today" | "Hour";

export interface Args {
  search: string[];
  scope: Scope;
  sort: Sort;
  filter: Filter;
  artifacters: Artifact[];
}

export interface Options extends Opts<Args> {}

export function configure(opts?: Partial<Options>) {
  const args: Args = {
    scope: "Posts",
    sort: "Relevance",
    filter: "All",
    search: ["popeye"],
    artifacters: [{ type: "selections", data: ["vote"] }],
     ...opts?.args,
  };
  const settings: Settings = {
    start: {
      all: true,
      new: true,
      attempts: 9,
      feature: "reddit",
      rando: { min: 1, max: 1 },
      iterations: { min: 1, max: 1 },
      variations: { min: 1, max: 1 },
      ...opts?.settings?.start,
      urls: [
        ...(opts?.settings?.start.all && args.search.length ? [BASE_URL] : []),
        ...(opts?.settings?.start.urls || []),
      ],
    },
    timeouts: {
      navigate: 60,
      default: 30,
      wait: 15,
      naps: { min: 256, max: 512 },
      ...opts?.settings?.timeouts,
    },
  };
  const ai: AI = {
    model: "gpt",
    decorators: {
      tone: "inteligent and whimsical",
      system: "You are a helpful social media assistant.",
      prefix: "As a social media expert you know how to make perfect decisions so consider the following:",
      human: "I am a reddit content creator, who creates interesting content",
      audience: "The target audience are reddit website users",
      background: "I currently am on reddit.com and looking for content",
      suffix: "Respond as creative as possible.",
    },
  };

  const options: Options = {
    settings,
    args,
    run: { ...opts?.run },
    ai: {
      model: opts?.ai?.model || ai.model,
      decorators: {
        tone: opts?.ai?.decorators.tone || ai.decorators.tone,
        system: opts?.ai?.decorators.system || ai.decorators.system,
        prefix: opts?.ai?.decorators.prefix || ai.decorators.prefix,
        human: opts?.ai?.decorators.human || ai.decorators.human,
        audience: opts?.ai?.decorators.audience || ai.decorators.audience,
        background: opts?.ai?.decorators.background || ai.decorators.background,
        suffix: opts?.ai?.decorators.suffix || ai.decorators.suffix,
      },
    },
  };

  return options;
}
