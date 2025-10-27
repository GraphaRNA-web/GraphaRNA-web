import { Page } from "@playwright/test";
import { ButtonElement, getButtonElement } from "../elements/buttonElement";

export class NavigationPage {
      readonly guide: ButtonElement;
      readonly home: ButtonElement;
      readonly about: ButtonElement;
      readonly cite: ButtonElement;
    // readonly myItems: ButtonElement;
    // readonly subordinatesItems: ButtonElement;
    // readonly itemshistory: ButtonElement;

    constructor(page: Page) {
        this.home = getButtonElement('nav a[href="/"]', page);
        this.guide = getButtonElement('nav a[href="/guide"]', page);
        this.about = getButtonElement('nav a[href="/about"]', page);
        this.cite = getButtonElement('nav a[href="/cite"]', page);
        // this.myItems = getButtonElement("#myItems", page);
        // this.subordinatesItems = getButtonElement("#subordinatesAssets", page);
        // this.itemshistory = getButtonElement("#history", page);
    }

    async toHome() {
         await this.home.click();
    }
    
    async toAbout() {
         await this.about.click();
    }

    async toCite() {
         await this.cite.click();
    }

     async toGuide() {
         await this.guide.click();
    }
    // async toSubordinatesItems() {
    //     await this.subordinatesItems.click();
    // }
    // async toItemshistory() {
    //     await this.itemshistory.click();
    // }
}
