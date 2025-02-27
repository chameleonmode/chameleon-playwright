import { chromium } from "@playwright/test";
import loader  from "./loader.js";

export default async function ({ file, port, options }: { file: string; port: number; options: unknown; }) {
  try {
    console.log(`Try: ${file} Port: ${port}`);
    const browser = await chromium.connectOverCDP(`http://localhost:${port}`);
    const script = await loader(file);
    await script(browser, options);
    console.log(`Try ${file} success`);
  } catch (error) {
    console.error(`Catch: ${(error as Error).message}`);
  } finally {
    console.log(`Finally ${file} completed finally block`);
  }
}
