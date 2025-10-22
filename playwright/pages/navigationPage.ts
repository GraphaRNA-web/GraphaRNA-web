import { Page } from "@playwright/test";
import { ButtonElement, getButtonElement } from "../elements/buttonElement";

export class NavigationPage {
      readonly guide: ButtonElement;
    // readonly myItems: ButtonElement;
    // readonly subordinatesItems: ButtonElement;
    // readonly itemshistory: ButtonElement;

    constructor(page: Page) {
        this.guide = getButtonElement('nav a[href="/guide"]', page);
        // this.myItems = getButtonElement("#myItems", page);
        // this.subordinatesItems = getButtonElement("#subordinatesAssets", page);
        // this.itemshistory = getButtonElement("#history", page);
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
