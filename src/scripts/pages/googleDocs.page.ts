import { Locator, Page } from "playwright";
import * as data from "../../data/gsiteData.json";
import * as googleData from "../../data/googleData.json";
import {generateRandomNumber} from '../../utils/utils'

export class GoogleDocsPage {
  private page: Page;
  readonly blankSheet: Locator;
  readonly docTitle: Locator;
  readonly xButton: Locator;
  readonly textArea: Locator;
  readonly dismissButton: Locator;

  //Find 
  readonly findTextBox: Locator;
  readonly findResultCount: Locator
  readonly findXButton: Locator

  readonly uploadFromComputer: Locator

  //Find and replace
  readonly findReplaceTextBox: Locator;
  readonly matchCaseCheckBox: Locator;
  readonly userRegularExpressionsCheckBox: Locator;
  readonly ignoreDiacriticsCheckBox: Locator;
  readonly findAndReplaceResultCount: Locator
  readonly findAndReplaceXButton: Locator

  //ToolBar
  readonly fontTB: {
    design: Locator;
    fontStyle: Locator;
    size: Locator;
    bold: Locator;
    italic: Locator;
    underline: Locator;
    color: Locator;
    specificColor:  (xx: string) => Locator;
    backGroundColor: Locator;
    insertImage: Locator;
    alignment: Locator;
    // xx4: (xx: string) => Locator;
  };

  //ToolBar
  readonly design: {
    normalText: Locator
    title 	: Locator	
    subTitle	: Locator
    heading1	: Locator
    heading2	: Locator
    heading3	: Locator
    heading4	: Locator
    specificDesign:(heading:string)=> Locator 
  };

  readonly alignment:{
    left: Locator
    center: Locator
    right: Locator
    justify: Locator
  };

  constructor(page: Page) {
    this.page = page;
    this.blankSheet = page.locator(`//img[contains(@src,"templates/thumbnails/docs-blank-googlecolors.png")]`);
    this.docTitle = page.locator(`#docs-title-widget .docs-title-input`);
    this.xButton = page.locator(`//div[contains(@class, 'docs-material-promo-walkthrough-bubble-close-button')]//div[contains(@class, 'goog-flat-button-outer-box')]`);
    this.textArea = page.locator(`//div[@class='kix-page-paginated canvas-first-page']//canvas[@class='kix-canvas-tile-content']`);
    this.dismissButton = page.locator(`//div[@class='docos-calltoactionview-text-and-buttons']//div[@role='button'][contains(.,'Dismiss')]`);
    
    //Find
    this.findTextBox = page.locator(`//input[@placeholder='Find in document']`)
    this.findResultCount = page.locator(`.docs-findinput-count`)
    this.findXButton = page.locator(`.docs-slidingdialog-button-close`)

    //Find and replace
    this.findReplaceTextBox = page.locator(`//input[@id='docs-findandreplacedialog-input']`);
    this.matchCaseCheckBox = page.getByRole("checkbox", { name: "Match case" });
    this.userRegularExpressionsCheckBox = page.getByRole("checkbox", {name: "Use regular expressions",});
    this.ignoreDiacriticsCheckBox = page.getByRole("checkbox", {name: "Ignore diacritics",});
    this.findAndReplaceResultCount = page.locator(`td[class='docs-findandreplacedialog-find'] span[class='docs-findinput-count']`)
    this.findAndReplaceXButton = page.locator(`div[class$='docs-findandreplacedialog'] span[aria-label='Close']`)

    //ToolBar
    this.fontTB ={
      design: page.locator(`div[id=':r']`),
      fontStyle: page.locator(`//div[@id=':v']`),
      size: page.locator(`input[aria-label='Font size']`),
      bold: page.locator(`div[id='boldButton'] div[class*='outer-box goog-inline-block']`),
      italic: page.locator(`div[id='italicButton'] div[class*='outer-box goog-inline-block']`),
      underline: page.locator(`div[id='underlineButton'] div[class*='outer-box goog-inline-block']`),
      color: page.locator(`div[id='textColorButton'] div[class*='outer-box goog-inline-block']`),
      specificColor: (colorName: string) => page.locator(`//td//div[@title='${colorName}']`),
      backGroundColor: page.locator(`//div[@id='bgColorButton']`),
      insertImage: page.locator(`div[id='insertImageButton'] div[class*='outer-box goog-inline-block']`),
      alignment: page.locator(`div[id='alignButton'] div[class*='menu-button-caption']`),

      // xx4: (xx: string) => page.locator(``),
    };

      this.design={
      normalText: page.locator(`//span[@class='goog-menuitem-label'][text()='Normal text']`),
      title: page.locator(`//span[@class='goog-menuitem-label'][text()='Title']`),
      subTitle:	page.locator(`//span[@class='goog-menuitem-label'][text()='Subtitle']`),
      heading1:	page.locator(`//span[@class='goog-menuitem-label'][text()='Heading 1']`),
      heading2:	page.locator(`//span[@class='goog-menuitem-label'][text()='Heading 1']`),
      heading3:	page.locator(`//span[@class='goog-menuitem-label'][text()='Heading 1']`),
      heading4:	page.locator(`//span[@class='goog-menuitem-label'][text()='Heading 4']`),
      specificDesign:(heading:string) => page.locator(`//span[@class='goog-menuitem-label'][text()='${heading}']`),
      }


      this.alignment ={
        left: page.locator(`#alignLeftButton`),
        center: page.locator(`#alignCenterButton`),
        right: page.locator(`#alignRightButton`),
        justify: page.locator(`#alignJustifyButton`),
      };

  
      this.uploadFromComputer = page.locator(`//span[@aria-label='Upload from computer u']`)

  }

  async formatText()
  {
    

  }





  async alignLeft()
  {
    await this.fontTB.alignment.click()
    await this.alignment.left.waitFor({state:"visible"})
    await this.alignment.left.click()
  }

  async alignRight()
  {
    await this.fontTB.alignment.click()
    await this.alignment.right.waitFor({state:"visible"})
    await this.alignment.right.click()
  }

  async alignCenter()
  {
    await this.fontTB.alignment.click()
    await this.alignment.center.waitFor({state:"visible"})
    await this.alignment.center.click()
  }

  async alignJustify()
  {
    await this.fontTB.alignment.click()
    await this.alignment.justify.waitFor({state:"visible"})
    await this.alignment.justify.click()
  }


  async enterTextwithDesign(text:string, design:string)
  {
    await this.enterText(text)//Enter text input
    await this.selectText(text)//Highlight text
    await this.fontTB.design.click()
    await this.design.specificDesign(design).waitFor({state:'visible'})
    await this.design.specificDesign(design).click()
    await this.page.waitForTimeout(data.mediumPauseTime);
  }

  async insertImage(imageName:string)
  {
    let directoryName = `C:\repo\ts-chamelion\playwright-automation-template\src\data\images`
    await this.fontTB.insertImage.waitFor({state:'visible'})
    await this.fontTB.insertImage.click()

    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await this.page.click('#fileInput');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
    name: 'chamelion1.jpg',
    mimeType: 'image',
    buffer: Buffer.from('example text', 'utf-8')

       // const fileChooserPromise = this.page.waitForEvent('filechooser');
    // await this.uploadFromComputer.waitFor({state:'visible'})
    // await this.fontTB.insertImage.click()
    // const fileChooser = await fileChooserPromise;
    // await fileChooser.setFiles(path.join(__dirname, 'chamelion1.jpg'));

    // await this.page.goto('http://127.0.0.1:3000');

    // const newPagePromise = this.page.context().waitForEvent('page');
    // await this.page.click('#openWindowButton');
    // const newPage = await newPagePromise;
    // await newPage.close();

    // await page.locator('#fileInput').setInputFiles({
    //   name: 'file.txt',
    //   mimeType: 'text/plain',
    //   buffer: Buffer.from('example text', 'utf-8')
    // })
  
    
    // await page.locator('#fileInput').setInputFiles({
    //   name: 'file.txt',
    //   mimeType: 'text/plain',
    //   buffer: Buffer.from('example text', 'utf-8')
    // })


  })}


  async navigate() {
    await this.page.goto("https://docs.google.com");
  }

  async closePopUpIfVisible() {
    await this.page.waitForTimeout(data.mediumPauseTime);
    if ((await this.xButton.count()) > 0) {
      await this.xButton.click();
    }
  }

  async dismissPopUpIfVisible() {
    await this.page.waitForTimeout(data.mediumPauseTime);
    if ((await this.dismissButton.count()) > 0) {
      await this.dismissButton.click();
    }
  }

  async alignText(text:string, alignment:string)
  {
    await this.selectText(text)
    await this.fontTB.alignment.waitFor()
    await this.fontTB.alignment.click()
    



  }

  

  async selectText(text: string) {
    await this.textArea.click()
    await this.page.keyboard.press("Control+A"); //Select All Text Content
    await this.page.keyboard.press("Control+F"); //Find
    await this.findTextBox.waitFor({ state: "visible" });
    await this.findTextBox.fill("");
    await this.findTextBox.fill(text);
    await this.page.keyboard.press("Enter"); 

    //Find Result Count
    let actualResultCount = (await this.findResultCount.textContent())!.toString()
    let splittedCount = actualResultCount.split(" of ")
    let actualCount = Number(splittedCount[1])
    await this.findXButton.click()
  }

  async createNewDocument() {
    // await this.page.click('button:has-text("Blank")');
    await this.blankSheet.click();
    await this.page.waitForTimeout(data.mediumPauseTime);
    await this.textArea.waitFor({state:"visible"});
    await this.textArea.click();
    await this.page.keyboard.press("Enter")
  }

  async setDocumentTitle(title: string) {
    await this.docTitle.fill(title);
    await this.page.waitForTimeout(data.mediumPauseTime);
  }

  async enterText(text: string) {
    await this.textArea.click();
    await this.page.keyboard.press("Control+End")
    await this.page.keyboard.press("Enter")
    await this.page.keyboard.type(text);
    await this.page.keyboard.press("Enter") //for new line
  }

  async saveDocument() {
    // Google Docs autosaves, but we can force a save
    await this.page.keyboard.press("Control+S");
  }

  //Toolbar functions ---------------------------------
  async boldFont(text:string)
  {
    await this.selectText(text) //highlight text
    await this.fontTB.bold.click() 
    await this.page.keyboard.press('End') //Press End to go to last 
    await this.fontTB.bold.click() //Disable Bold for new
  }

  async italicFont(text:string)
  {
    await this.selectText(text) //highlight text
    await this.fontTB.italic.click() 
    await this.page.keyboard.press('End') //Press End to 
    await this.fontTB.italic.click() //Disable Italic for new
  }

  async underlineFont(text:string)
  {
    await this.selectText(text) //highlight text
    await this.fontTB.underline.click() 
    await this.page.keyboard.press('End') //Press End to 
    await this.fontTB.underline.click() //Disable Underline for new
  }

  async textColor(text:string, colorName:string)
  {
    await this.selectText(text) //highlight text
    await this.fontTB.color.click() 
    if((colorName).toLowerCase() === "random") //for random font color
    {
      colorName = await this.getRandomColorName()
    }
    await this.fontTB.specificColor(colorName.toLowerCase()).waitFor({state:'visible'})
    await this.fontTB.specificColor(colorName.toLowerCase()).click()
    await this.page.keyboard.press('End') //Press end
  }

  async getRandomColorName()
  {
    let currentColor
    const randomIndex4 = generateRandomNumber(googleData.color2.length)
    currentColor = googleData.color2[randomIndex4]
    console.log("Current Color : " + currentColor)
    return currentColor
  }

  // async selectText2(text: string) {
  //   // let actualResultCount
  //   //let splittedCount = []
  //   await this.textArea.click()
  //   await this.page.keyboard.press("Control+A"); //Select All Text Content
  //   await this.page.keyboard.press("Control+F"); //Find
  //   await this.findTextBox.waitFor({ state: "visible" });
  //   await this.findTextBox.fill("");
  //   await this.findTextBox.fill(text);
  //   await this.page.keyboard.press("Enter"); 

  //   //Check Boxes
  //   if (!(await this.matchCaseCheckBox.isChecked())) {
  //     await this.matchCaseCheckBox.check();
  //   }
  //   if (!(await this.userRegularExpressionsCheckBox.isChecked())) {
  //     await this.userRegularExpressionsCheckBox.check();
  //   }
  //   if (!(await this.ignoreDiacriticsCheckBox.isChecked())) {
  //     await this.ignoreDiacriticsCheckBox.check();
  //   }
  //   let actualResultCount = (await this.findAndReplaceResultCount.textContent())!.toString()
  //   console.log("Actual Result Count" + actualResultCount)
  //   let splittedCount = actualResultCount.split(" of ")
  //   console.log(splittedCount + " : " + splittedCount!.length + " : index 0" + splittedCount![0]  + " : index 0" + splittedCount![1])
  //   let actualCount = Number(splittedCount[1])
  //   if(actualCount>0)
  //   {
  //     expect(actualCount).toBeGreaterThan(0)
  //   }
  //   await this.findAndReplaceXButton.click()
    
  // }



}
