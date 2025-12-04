import { expect, Page } from "@playwright/test";
import { BaseElement } from "./baseElement";

export class TextElement extends BaseElement {
    constructor(selector: string, page: Page) {
        super(selector, page);
    }

    
    async getText(): Promise<string> {
        return await this.element().innerText();
    }

    
    async toHaveExactText(expectedText: string): Promise<void> {
        await expect(this.element()).toHaveText(expectedText);
    }

   
    async toContainText(expectedText: string): Promise<void> {
        await expect(this.element()).toContainText(expectedText);
    }

    
    async toMatchText(regex: RegExp): Promise<void> {
        const actualText = await this.getText();
        expect(actualText).toMatch(regex);
    }
}
