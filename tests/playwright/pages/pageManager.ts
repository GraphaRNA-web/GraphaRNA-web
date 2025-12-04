import { Page } from "@playwright/test"
import { NavigationPage } from "./navigationPage";
import { HomePage } from "./homePage";
import { AboutPage } from "./aboutPage";
import { CitePage } from "./citeUsPage";
import { GuidePage } from "./guidePage";
import { ResultsPage } from "./resultsPage";
import { JobsPage } from "./jobsPage";

export class PageManager {
    private readonly page: Page;
 //   private itemsPage: ItemsPage;
    private navigationPage: NavigationPage;
    private resultsPage: ResultsPage;
    private homePage: HomePage;
    private aboutPage: AboutPage;
    private citePage: CitePage;
    private guidePage: GuidePage;
    private jobsPage: JobsPage;


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

    get onHomePage() {
        return this.homePage ?? (this.homePage = new HomePage(this.page));
    }

    get onAboutPage() {
        return this.aboutPage ?? (this.aboutPage = new AboutPage(this.page));
    }

    get onCitePage() {
        return this.citePage ?? (this.citePage = new CitePage(this.page));
    }

    get onGuidePage() {
        return this.guidePage ?? (this.guidePage = new GuidePage(this.page));
    }
    get onJobsPage() {
        return this.jobsPage ?? (this.jobsPage = new JobsPage(this.page));
    }   


}
