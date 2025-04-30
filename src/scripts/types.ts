interface Opts<T> {
  args: T;
  settings: Settings;
}

interface Settings {
  start: Start;
  timeouts: Timeouts;
}

interface Start {
  feature: string;
  attempts: number;
  variations: Rando;
  iterations: Rando;
  rando: Rando;
  new: boolean;
  url?: string;
}

interface Timeouts {
  default: number;
  wait: number;
  navigate: number;
  naps: Rando;
}

interface Rando {
  min: number;
  max: number;
  multiplier?: number;
}

export type { Opts, Start, Settings, Timeouts, Rando };
