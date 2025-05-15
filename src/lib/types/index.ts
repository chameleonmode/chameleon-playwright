type App = {
  api?: string;
};

interface Arti<T> {
  [string: string]: T;
}
interface Artifact extends Arti<any> {}

interface Opts<T> {
  args: T;
  ai: AI;
  run: Artifact;
  settings: Settings;
}

interface Settings {
  start: Start;
  timeouts: Timeouts;
}

type Rando = {
  [K in keyof Ranger]: Ranger[K];
} & {
  multiplier?: number;
};
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
  system: string;
  prefix: string;
  human: string;
  audience: string;
  background: string;
  tone: Tone | string | null;
  suffix: string;
};

type Ranger = {
  min: number;
  max: number;
};
type Term = {
  term: string;
  reason: string;
};
type Input = {
  type: Kind;
  data: string;
  reason: string;
};
type Generators = {
  type: Kind;
  sys: string;
  context: string;
  range: Ranger;
  input: Input;
  terms: Input[];
};

type AI = {
  task: string;
  decorators: Decorations;
  generations: Generators;
};

type Tone = "sarcastic" | "informative" | "relatable" | "straightforward";
type Kind = "comment" | "post" | "reply" | "title" | "search" | "prompt" | "term" | "";
type Range = { min: number; max: number };

export * from "./ai.js";
export { Arti, Opts, Start, Settings, Timeouts, Artifact };
export type { Ranger, App, Term, Rando, AI, Kind, Range, Tone, Decorations, Generators, Input };
