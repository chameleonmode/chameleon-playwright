import { AI } from "./types/ai.js";

export type App = { api?: string; ai?: AI };
export type Anything = { [string: string]: any };
export type Ranger = { min: number; max: number };
export type Rando = Ranger & { multiplier?: number };
export type Arti<T> = { [string: string]: T };
export type Artifact = Arti<any>;

export * from "./types/ai.js";
export * from "./types/scripts.js";
export * from "./logger.js";
export * from "./requests.js";
export * from "./runner.js"
export * from "./utils.js";
