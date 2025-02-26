import { chromium } from "@playwright/test";
import loader  from "./loader";

export default async function ({ file, port, data }: { file: string; port: number; data: any; }) {
  try {
    console.log(`Try: ${file} Port: ${port}`);
    const browser = await chromium.connectOverCDP(`http://localhost:${port}`);
    const script = await loader(file);
    await script(browser, data);
    console.log(`Try ${file} success`);
  } catch (error) {
    console.error(`Catch ${file} failed: ${(error as Error).message}`);
  } finally {
    console.log(`Finally ${file} completed finally block`);
  }
}
