// playwright/pages/citePage.ts

import { Locator, Page } from "@playwright/test";
import { BasePage } from "./basePage";

export class CitePage extends BasePage {
    readonly title: Locator;
    readonly subtitle: Locator;
    readonly citationText: Locator;

    constructor(page: Page) {
        super(page, "/cite", undefined, ".cite");

        this.title = page.locator(".cite-title");
        this.subtitle = page.locator(".cite-subtitle");
        this.citationText = page.locator(".cite-para");
    }
}