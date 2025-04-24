interface Opts<T> {
  args: T;
  settings: Settings;
}

interface Settings {
  start: Start;
  timeouts: Timeouts;
  rando: Rando;
  iterations: Rando;
}

interface Start {
  feature: string;
  url?: string;
  new?: boolean;
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
