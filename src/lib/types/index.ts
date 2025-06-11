
export * from "./ai.js";
export * from "./scripts.js";
export type App = { api?: string };

export interface Ranger {
  min: number;
  max: number;
}
export interface Rando extends Ranger {
  multiplier?: number;
}

export interface Arti<T> {
  [string: string]: T;
}

export interface Artifact extends Arti<any> {}