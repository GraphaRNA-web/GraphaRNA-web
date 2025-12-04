// playwright/pages/homePage.ts

import { Locator, Page } from "@playwright/test";
import { BasePage } from "./basePage"; 
import { ButtonElement, getButtonElement } from "../elements/buttonElement";

export class HomePage extends BasePage {
    // Text elements
    readonly introExplore: Locator;
    readonly introWorld: Locator;
    readonly introGrapha: Locator;
    readonly description: Locator;
    
    // Buttons
    readonly startJobButton: ButtonElement;
    readonly guideButton: ButtonElement;

    constructor(page: Page) {
        super(page, "/", undefined, ".home-container");

        // Init locators and buttons
        this.introExplore = page.locator(".intro-explore");
        this.introWorld = page.locator(".intro-world");
        this.introGrapha = page.locator(".intro-grapha");
        this.description = page.locator(".home-description-text p");

        this.startJobButton = getButtonElement("#home-start-button", page);
        this.guideButton = getButtonElement("#home-guide-button", page);
    }
}