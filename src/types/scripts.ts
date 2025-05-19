import { AI, Artifact, Ranger } from "./index.js";

export interface Opts<T> {
  args: T;
  ai: AI;
  run: Artifact;
  settings: Settings;
}

export interface Settings {
  start: Start;
  timeouts: Timeouts;
}

export type Rando = {
  [K in keyof Ranger]: Ranger[K];
} & {
  multiplier?: number;
};

export interface Start {
  rando: Rando;
  new: boolean;
  all: boolean;
  urls: string[];
  feature: string;
  attempts: number;
  variations: Rando;
  iterations: Rando;
}

export interface Timeouts {
  navigate: number;
  default: number;
  wait: number;
  naps: Rando;
}

export const settings: Settings = {
  start: {
    all: true,
    new: true,
    attempts: 9,
    feature: "reddit",
    rando: { min: 1, max: 1 },
    iterations: { min: 1, max: 1 },
    variations: { min: 1, max: 1 },
    urls: [],
  },
  timeouts: {
    navigate: 60,
    default: 30,
    wait: 15,
    naps: { min: 256, max: 512 },
  },
};
