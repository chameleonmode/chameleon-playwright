import { Opts } from "../types";

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
    timeout: 1000 * 60 * 1,
    wait: 1000,
    max: 3,
    variations: 1,
  },
};
export default function (opts: Partial<Opts<Args>>) {
  return {
    ...defaults,
    ...opts,
    args: {
      ...defaults.args,
      ...opts.args,
    },
    settings: {
      ...defaults.settings,
      ...opts.settings,
    },
  };
}
export type { Opts, Args, Sort, Filter, Scope };