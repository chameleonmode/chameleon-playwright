import { Opts } from "../types.js";

type Scope = "Top" | "Latest" | "People" | "Media" | "Lists";

interface Args {
  search: string;
  scope: Scope;
}

interface Options extends Opts<Args> { }

export const defaults: Opts<Args> = {
  args: {
    search: "chameleon",
    scope: "Top",
  },
  settings: {
    start: {
      feature: "default",
    },
    timeouts: {
      default: 36,
      navigate: 72,
      wait: 18,
      naps: {
        min: 256,
        max: 512,
        multiplier: undefined,
      },
    },
    rando: {
      min: 1,
      max: 3,
    },
    iterations: {
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
export type { Args, Options, Scope };