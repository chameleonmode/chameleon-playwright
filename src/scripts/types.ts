interface Opts<T> {
  args: T;
  start: Start;
  settings: Settings;
}

interface Start {
  feature: string;
  url?: string;
  new?: boolean;
}

interface Settings {
  timeouts: Timeouts;
  rando: Rando;
  variations: Rando;
}

interface Timeouts {
  default: number;
  wait: number;
  navigate: number;
  rando: Rando;
}

interface Rando {
  min: number;
  max: number;
  multiplier?: number;
}

export type { Opts, Start, Settings, Timeouts, Rando };
