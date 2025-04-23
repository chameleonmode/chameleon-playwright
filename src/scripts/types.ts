interface Opts {
  start: Start;
  search: Search;
  settings: Settings;
}

interface Start {
  feature: string;
  url: string;
}

interface Search {
  term: string;
  scope: Scope;
  sort?: Sort;
  filter?: Filter;
}

interface Settings {
  timeout?: number;
  wait?: number;
  max?: number;
  variations: number;
}

const defaults: Opts = {
  start: {
    feature: "",
    url: "",
  },
  search: {
    term: "chameleon",
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

type Scope = "Posts" | "Communities" | "Comments" | "Media" | "People";
type Sort = "Relevance" | "Hot" | "Top" | "New" | "Rising" | "Comment count";
type Filter = "All time" | "Past year" | "Past month" | "Past week" | "Today" | "Past hour";

export default function (opts: Partial<Opts>) {
  return {
    ...defaults,
    ...opts,
    search: {
      ...defaults.search,
      ...opts.search,
    },
    settings: {
      ...defaults.settings,
      ...opts.settings,
    },
  };
}
export type { Opts, Start, Search, Settings, Sort, Filter, Scope };