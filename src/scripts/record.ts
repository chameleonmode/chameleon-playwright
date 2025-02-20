import { Page } from '@playwright/test';

export default async function(page: Page, testData: any): Promise<void> {
    await page.pause();
}