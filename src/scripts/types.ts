import { Rando } from "../lib/utils.js";
import { Tone, Kind } from "../lib/ask.js";


interface Arti<T> {
  [string: string]: T;
}
interface Artifact extends Arti<any> {}

interface Opts<T> {
  ai: AI;
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
  all: boolean;
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

type Decorations = {
  prefix: string;
  background: string;
  human: string;
  audience: string;
  suffix: string;
  tone: Tone | string;
  system: string;
};

type Generators = {
  range: { min: number; max: number };
  terms: { term: string; reason: string }[];
  input: {type: Kind; data: string, reason: string};
};

type AI = {
  task: string;
  decorators: Decorations;
  generations: Generators;
};

export type { AI, Tone, Kind, Decorations, Generators };
export { Opts, Start, Settings, Timeouts, Rando, Artifact };
