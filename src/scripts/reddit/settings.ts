import { Opts } from "../types.js";

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


export default function (opts: Options) {
  return {
    ...opts,
  };
}

export type { Args, Options, Sort, Filter, Scope };
