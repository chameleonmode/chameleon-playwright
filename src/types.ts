type App = {
  api?: string;
};

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
  prefix: string;
  background: string;
  human: string;
  audience: string;
  suffix: string;
  tone: Tone | string | null;
  system: string;
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

export {
  Arti,
  Opts,
  Start,
  Settings,
  Timeouts,
  Artifact,
  App,
  Term,
  Rando,
  AI,
  Kind,
  Range,
  Tone,
  Decorations,
  Generators,
  Input,
  Ranger,
};
