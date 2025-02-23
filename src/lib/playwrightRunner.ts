import { chromium } from '@playwright/test';
import { loadScript } from './utils.fs.js';

export async function runTest(file: string, args: any, port: number): Promise<void> {
  console.log(`Running: ${file}`);
  console.log(`Args: ${JSON.stringify(args)}`);
  console.log(`CDP Port: ${port}`);

  try {
    const browser = await chromium.connectOverCDP(`http://localhost:${port}`);
    const script = await loadScript(file);
    await script(browser, args);
    console.log(`Test ${file} completed successfully`);
  } catch (error) {
    console.error(`Test ${file} failed: ${(error as Error).message}`);
    throw error;
  } finally {
    console.log(`Test ${file} completed finally block`);
  }
}
