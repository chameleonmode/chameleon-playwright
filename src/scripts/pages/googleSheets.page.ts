import { Locator, Page } from 'playwright';
import * as data from  '../../data/gsiteData.json'

export class GoogleSheetsPage {
    private page: Page;

    readonly blanksheet: Locator;
    readonly spreadSheetTitle:Locator;


    constructor(page: Page) {
        this.page = page;


        this.blanksheet = page.locator(`//img[contains(@src,"templates/thumbnails/sheets-blank-googlecolors.png")]`)
        //img[contains(@src,"templates/thumbnails/sheets-blank-googlecolors.png")]
        // this.blanksheet = page.locator(`//img[contains(@src,"templates/thumbnails/docs-blank-googlecolors.png")]`)
        //img[contains(@src,"templates/thumbnails/docs-blank-googlecolors.png")]
        this.spreadSheetTitle = page.locator(`#docs-title-widget`)
        this.spreadSheetTitle = page.locator(`#docs-title-widget .docs-title-input`)
    }

    async navigate() {
        await this.page.goto('https://sheets.google.com');
    }

    async createNewSpreadsheet() {
        await this.blanksheet.click();
        await this.page.waitForTimeout(data.mediumPauseTime)
    }

    async setSpreadsheetTitle(title: string) {
        await this.spreadSheetTitle.fill(title);

    }

    async enterCellValue(cell: string, value: string) {
        await this.page.fill(`[aria-label="${cell}"]`, value);
        await this.page.keyboard.press('Enter');
    }

    async saveSpreadsheet() {
        // Google Sheets autosaves, but we can force a save
        await this.page.keyboard.press('Control+S');
    }
}