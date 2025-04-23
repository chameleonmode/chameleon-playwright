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
  sort: Sort;
  filter: Filter;
}

interface Settings {
  timeout: number;
  wait: number;
  max: number;
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
    sort: "None",
    filter: "All",
  },
  settings: {
    timeout: 60 * 5,
    wait: 1000,
    max: 3,
    variations: 1,
  },
};

type Scope = "Posts" | "Comments" | "Communities" | "Users";
type Sort = "None" | "Relevance" | "Hot" | "Top" | " New" | "Rising" | "Comments";
type Filter = "All" | "Hour" | "Day" | "Week" | "Month" | "Year";

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