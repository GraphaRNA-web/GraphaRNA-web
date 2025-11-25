// playwright/pages/guidePage.ts

import { Locator, Page } from "@playwright/test";
import { BasePage } from "./basePage";

export class GuidePage extends BasePage {
    readonly tocTitle: Locator;
    readonly tocList: Locator;
    
    readonly tocLinkSubmitJob: Locator;
    readonly tocLinkViewJob: Locator;
    readonly tocLinkJobsQueue: Locator;

    readonly headerSubmitJob: Locator;
    readonly headerViewJob: Locator;
    readonly headerJobsQueue: Locator;


    constructor(page: Page) {
        super(page, "/guide", undefined, ".guide-page");

        this.tocTitle = page.locator(".header-guide-toc-title");
        this.tocList = page.locator(".guide-toc-list");
        this.tocLinkSubmitJob = page.locator('.guide-toc-list a[href="#submit-job"]');
        this.tocLinkViewJob = page.locator('.guide-toc-list a[href="#view-job"]');
        this.tocLinkJobsQueue = page.locator('.guide-toc-list a[href="#jobs-queue"]');

        this.headerSubmitJob = page.locator("h1#submit-job");
        this.headerViewJob = page.locator('h1#view-job');
        this.headerJobsQueue = page.locator('h1#jobs-queue');
    }
}