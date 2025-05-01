import { Rando } from "../lib/utils.js";

interface Opts<T> {
  args: T;
  settings: Settings;
}

interface Settings {
  start: Start;
  timeouts: Timeouts;
}

interface Start {
  rando: Rando;
  new: boolean;
  urls: string[];
  feature: string;
  attempts: number;
  variations: Rando;
  iterations: Rando;
}

interface Timeouts {
  navigate: number;
  default: number;
  wait: number;
  naps: Rando;
}

export type { Opts, Start, Settings, Timeouts, Rando };
