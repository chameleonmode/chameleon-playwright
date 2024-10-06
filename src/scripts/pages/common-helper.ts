import { Locator, Page } from 'playwright';
import * as data from  '../../data/json/data.json'

export class CommonHelper {
    private page: Page;
    readonly blankSheet: Locator;
    readonly docTitle: Locator;
    //Login Modal
    readonly emailTextBox: Locator;
    readonly passwordTextBox: Locator;
    readonly nextButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.blankSheet = page.locator(`//img[contains(@src,"templates/thumbnails/sheets-blank-googlecolors.png")]`)
        this.docTitle = page.locator(`#docs-title-widget`)
        //Login Modal
        this.emailTextBox = page.locator(`//div//input[@type='email']`);
        this.passwordTextBox = page.locator(`//div//input[@type='password']`);
        this.nextButton = page.getByRole('button', { name: 'Next' });
    }

    async loginToGoogle(email: string, password: string) {

        //Enter Email
        await this.emailTextBox.waitFor({ state: 'visible' });
        await this.emailTextBox.fill(email);
        await this.nextButton.waitFor({state:'visible', timeout: 5000 });
        await this.nextButton.click();
        await this.page.waitForTimeout(data.longPauseTime);

        //Enter Password
        await this.passwordTextBox.waitFor({ state: 'visible' });
        await this.passwordTextBox.fill(password);
        await this.nextButton.waitFor({state:'visible', timeout: 5000 });
        await this.nextButton.click();
        await this.page.waitForTimeout(data.longPauseTime);
    }

}