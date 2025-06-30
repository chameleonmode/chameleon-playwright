import { BrowserContext, Locator } from "@playwright/test";
import { AI, Artifact, Rando } from "./index.js";

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

export interface Start {
  new: boolean;
  all: boolean;
  urls: string[];
  feature: string;
  attempts: number;
  variations: Rando;
  iterations: Rando;
  rando: Rando;
}

export interface Timeouts {
  navigate: number;
  default: number;
  wait: number;
  naps: Rando;
  artifacto: Artifact;
}

export interface InitParams<T> {
  ctx: BrowserContext;
  opts: Partial<T>;
}

export interface Findo {
	listing: Locator;
	attributes: Record<string, string>;
}

