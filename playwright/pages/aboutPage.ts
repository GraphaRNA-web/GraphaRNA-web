// playwright/pages/aboutPage.ts

import { Locator, Page } from "@playwright/test";
import { BasePage } from "./basePage";

export class AboutPage extends BasePage {
    readonly title: Locator;
    readonly authorsTitle: Locator;
    readonly fundsTitle: Locator;
    readonly authorsList: Locator;

    constructor(page: Page) {
        super(page, "/about", undefined, ".ap-content");

        this.title = page.locator(".about-title");
        this.authorsTitle = page.locator(".authors-title");
        this.fundsTitle = page.locator(".funds-title");
        this.authorsList = page.locator(".author .name");
    }
}