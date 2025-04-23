import { Opts, Settings } from "../types";

type Scope = "Posts" | "Communities" | "Comments" | "Media" | "People";
type Sort = "Relevance" | "Hot" | "Top" | "New" | "Rising" | "Comment count";
type Filter = "All time" | "Past year" | "Past month" | "Past week" | "Today" | "Past hour";

interface Args {
  search: string;
  scope: Scope;
  sort: Sort;
  filter: Filter;
}

export const defaults: Opts<Args> = {
  start: {
    feature: "",
    url: "",
  },
  args: {
    search: "chameleon",
    scope: "Posts",
    sort: "Relevance",
    filter: "All time",
  },
  settings: {
    timeouts: {
      default: 1,
      navigate: 2,
      wait: 6,
      rando: {
        min: 256,
        max: 512,
        multiplier: undefined,
      },
    },
    rando: {
      min: 1,
      max: 3,
    },
    variations: {
      min: 1,
      max: 3,
    },
  },
};
export default function (opts: Partial<Opts<Args>>) {
  return {
    ...defaults,
    ...opts,
  };
}
export type { Opts, Settings, Args, Sort, Filter, Scope };
