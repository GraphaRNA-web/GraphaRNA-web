import { Page } from "@playwright/test";
import { BaseElement } from "./baseElement";

export class ButtonElement extends BaseElement {
    constructor(
        public selector: string,
        page: Page,
    ) {
        super(selector, page);
    }

    async validateElement(isEnabled: boolean, isVisible: boolean, expectedLabel: string) {
        if (isVisible == true) {
            await this.toBeVisible();

            isEnabled ? await this.toBeEnabled() : await this.toBeDisabled();
            await this.validateLabel(expectedLabel);
        } else {
            await this.toBeDetached();
        }
    }

    async validateLabel(expectedLabel: string) {
        await this.toHaveText(expectedLabel);
    }

    async clickAndGetResponse(url: string, path: string, status: number = 200, timeouts: number = 60000) {
        const [response] = await Promise.all([
            this.page.waitForResponse(resp => resp.url().includes(`${url}/${path}`) && resp.status() === status, { timeout: timeouts }),
            this.element().click(),
        ]);

        return response; // Return the response object
    }

    
}
export function getButtonElement(selector: string, page: Page): ButtonElement {
    return new ButtonElement(selector, page);
}
