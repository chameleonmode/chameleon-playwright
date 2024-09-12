import { Page } from "playwright-core";

export interface Config {
  [key: string]: string;
}

export interface IConsoleCommand {
  name: string;
  port: number;
  data: any;
  [action: string]: string | number | any; // Adjusted index signature
}