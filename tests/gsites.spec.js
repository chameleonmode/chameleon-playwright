const { test, expect } = require('@playwright/test');
import {url, testEmail, testPW, textContent, textSearch, antidetect, washington, gsiteTitle} from  '../testData/testData.json'

test('Gsite - Test Case 1', async ({ page }) => {
    test.slow()
    //Navigate to URL
    await page.goto(url);
    await page.waitForLoadState('domcontentloaded');

    //Enter Email
    await page.locator(`//div//input[@type='email']`).waitFor({state:'visible'});
    await page.locator(`//div//input[@type='email']`).fill(testEmail);
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible({timeout:5000});
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(5000);

    //Enter Password
    await page.locator(`//div//input[@type='password']`).waitFor({state:'visible'});
    await page.locator(`//div//input[@type='password']`).fill(testPW);
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible({timeout:5000});
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(5000);

    //Click on Sites
    await page.locator(`//img[contains(@src,'blank-googlecolors.png')]`).waitFor({state:'visible'});
    await page.locator(`//img[contains(@src,'blank-googlecolors.png')]`).click();
    await page.waitForLoadState('load');

    //Rename the title
    await expect(page.locator(`label[for='i5']`)).toBeVisible();
    await page.locator(`label[for='i5']`).fill(gsiteTitle);


    //Populate the Blank Sheet Title
    await page.locator(`//div[@role='textbox']`).click();
    await page.keyboard.press("Control+A");
    await page.keyboard.press("Delete");
    await page.keyboard.type("Anti Detect Browser");

    //Click Text and Populate it
    await page.locator(`//div[@aria-label='Text box']`).click();
    await page.locator(`//div[@role='textbox']//p`).click();
    await page.keyboard.type(textContent);

    //Click Youtube
    await page.locator(`//div[@role='menu'][2]//span[contains(.,"YouTube")]`).click();
    await page.waitForLoadState('load');
    const iframe = page.frameLocator(`//iframe`).last();
    await iframe.locator(`//input[@aria-label='Search all of YouTube or paste URL'] | //input[@aria-label="Search terms"]`).click();
    await page.keyboard.type(textSearch);
    await page.keyboard.press("Enter");
    await page.waitForLoadState('load');
    await iframe.locator(`//div[@role='option'][1]`).click();
    await iframe.getByRole('button', { name: 'Select' }).click();

    //Click Map
    await page.locator(`//div[@role='menu'][2]//span[contains(.,"Map")]`).click();
    await page.waitForLoadState('load');
    const iframe2 = page.frameLocator(`//iframe`).last();
    await expect(iframe2.locator(`//form//input[@placeholder='Enter a location']`)).toBeVisible({timeout:5000});
    await iframe2.locator(`//form//input[@placeholder='Enter a location']`).click();
    await page.keyboard.type(washington);
    await page.waitForTimeout(3000);
    await expect(iframe2.locator(`//div[@class='pac-item']`).first()).toBeVisible();
    await iframe2.locator(`//div[@class='pac-item']`).first().click();
    await iframe2.getByRole('button', { name: 'Select' }).click();
    await page.waitForTimeout(3000);
    
    //Publish
    await page.locator(`//span[text()="Publish"]`).click();
    await page.waitForLoadState('load');
    await expect(page.locator(`//input[@class='poFWNe zHQkBf']`)).toBeVisible();
    await page.locator(`//input[@class='poFWNe zHQkBf']`).click(); 
    //Generate Unique Name
    while(await page.getByRole('button', { name: 'Publish' }).last().isDisabled()){
        const uniqueAntiDetectName = "Gsite" + Math.random().toString()
        uniqueAntiDetectName = uniqueAntiDetectName.replace('.', "")
        console.log(uniqueAntiDetectName)
        await page.keyboard.type(antidetect);
        await page.waitForLoadState('load');
        if(await page.getByRole('button', { name: 'Publish' }).last().isEnabled())
        {
            await page.getByRole('button', { name: 'Publish' }).last().click();
        }
        await page.keyboard.press("Control+A");
        await page.keyboard.press("Delete");
    }
});

test.setTimeout(10000000)
