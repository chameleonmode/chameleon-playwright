import { Page } from '@playwright/test';

export default async function(page: Page, args: any): Promise<void> {
    await page.pause();
}