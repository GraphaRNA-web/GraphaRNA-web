import { Page } from "@playwright/test"
import { NavigationPage } from "./navigationPage";

export class PageManager {
    private readonly page: Page;
 //   private itemsPage: ItemsPage;
    private navigationPage: NavigationPage;


    constructor(page: Page) {
        this.page = page;
        this.navigationPage= new NavigationPage(page)
    }

    // get onItemsPage() {
    //     return this.itemsPage ?? (this.itemsPage = new ItemsPage(this.page));
    // }
    get onNavigationPage() {
        return this.navigationPage ?? (this.navigationPage = new NavigationPage(this.page));
    }


}
