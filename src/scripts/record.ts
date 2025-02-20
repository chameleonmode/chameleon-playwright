import { Page } from 'playwright-core';

export default async function(page: Page, testData: any): Promise<void> {
    await page.pause();
}