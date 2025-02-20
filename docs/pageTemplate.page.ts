import { Locator, Page } from "playwright";

export default class pageTemplate {
  page: Page;
  // LOCATORS
  readonly xxBasic: Locator;
  readonly xxParameterized: (xx: string) => Locator;
  readonly groupLocator: {
    xx1: Locator;
    xx2: Locator;
    xx3: Locator;
    xx4: (xx: string) => Locator;
  };

  constructor(page: Page) {
    this.page = page;
    //Locator Initialization
    this.xxBasic = page.locator(`xx`);
    this.xxParameterized = (xx: string) => page.locator(`xx${xx}`);

    this.groupLocator = {
      xx1: page.locator(`xx`),
      xx2: page.locator(`xx`),
      xx3: page.locator(`xx`),
      xx4: (xx: string) => page.locator(`xx${xx}`),
    };
  }

  //Parameterize Function
  async reusableFunction1() {
    //Enter Code Here
  }

  //Parameterize Function
  async reusableFunction2(searchText: string) {
    //Enter Code Here
  }
}
