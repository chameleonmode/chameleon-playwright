import { Page } from "playwright-core";

export interface Config {
  [key: string]: string;
}

export type TestScript = (page: Page, testData: any) => Promise<void>;
