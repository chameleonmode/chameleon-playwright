interface Opts<T> {
  args: T;
  start: Start;
  settings: Settings;
}

interface Start {
  feature: string;
  url: string;
}

interface Settings {
  timeout: number;
  wait: number;
  max: number;
  variations: number;
}

export type { Opts, Start, Settings };