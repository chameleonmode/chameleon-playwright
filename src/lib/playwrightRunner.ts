import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// Recreate __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runTest(testName: string, testData: any, cdpPort: number): Promise<void> {
  console.log(`Running test: ${testName}`);
  console.log(`Test data: ${JSON.stringify(testData)}`);
  console.log(`CDP Port: ${cdpPort}`);

  try {
    const testScript = await loadTestScript(testName);
    if (!testScript) {
      throw new Error(`Test script for "${testName}" not found`);
    }

    const browser = await chromium.connectOverCDP(`http://localhost:${cdpPort}`);
    const context = browser.contexts()[0];
    const page = await context.newPage();

    await testScript(page, testData);

    console.log(`Test ${testName} completed successfully`);
    await browser.close();
  } catch (error) {
    console.error(`Test ${testName} failed: ${(error as Error).message}`);
    throw error;
  } finally {
    console.log(`Test ${testName} completed finally block`);
  }
}

async function loadTestScript(testName: string): Promise<any> {
  const scriptPath = path.join(__dirname, '..', '/scripts', `${testName}.js`);
  const scriptUrl = pathToFileURL(scriptPath).href;
  try {
    console.log(`Attempting to load script from: ${scriptUrl}`);
    const module = await import(scriptUrl);
    return module.default || module[testName];
  } catch (error) {
    console.error(`Error loading test script: ${(error as Error).message}`);
    return null;
  }
}