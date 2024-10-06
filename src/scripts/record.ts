import { Page } from 'playwright-core';

export async function record(page: Page, testData: any): Promise<void> {
    await page.pause();
}

export default record;