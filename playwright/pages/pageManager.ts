import { Page } from "@playwright/test"
import { NavigationPage } from "./navigationPage";
import { ResultsPage } from "./resultsPage";

export class PageManager {
    private readonly page: Page;
 //   private itemsPage: ItemsPage;
    private navigationPage: NavigationPage;
    private resultsPage: ResultsPage;


    constructor(page: Page) {
        this.page = page;
        this.navigationPage= new NavigationPage(page)
        this.resultsPage = new ResultsPage(page);
    }

    // get onItemsPage() {
    //     return this.itemsPage ?? (this.itemsPage = new ItemsPage(this.page));
    // }
    get onResultsPage() {
        return this.resultsPage ?? (this.resultsPage = new ResultsPage(this.page));
    }
    get onNavigationPage() {
        return this.navigationPage ?? (this.navigationPage = new NavigationPage(this.page));
    }
    get currentPage() {
        return this.page;
    }


}
