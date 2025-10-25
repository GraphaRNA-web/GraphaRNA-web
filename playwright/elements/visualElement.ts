import { Page, expect } from "@playwright/test";
import { BaseElement } from "./baseElement";

export class VisualElement extends BaseElement {
  constructor(selector: string, page: Page) {
    super(selector, page);
  }

  
  async toHaveScreenshot(name: string, options?: Parameters<typeof expect['extend']>[0]) {
    await expect(this.element()).toHaveScreenshot(name, options);
  }

  
  async screenshot(path: string, options?: { fullPage?: boolean }) {
    await this.element().screenshot({ path, ...options });
  }
}
