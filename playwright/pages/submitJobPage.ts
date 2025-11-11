// pages/submitJobPage.ts
import { Page, Locator } from "@playwright/test";

export class SubmitJobPage {
  readonly page: Page;
  readonly textArea: Locator;
  readonly validateButton: Locator;
  readonly errorBox: Locator;
  readonly approveBox: Locator;
  readonly example1Button: Locator;
  readonly example2Button: Locator;
  readonly example3Button: Locator;
  readonly interactiveBox: Locator;
  readonly addStructureButton: Locator;
  readonly sliderOption: (option: string) => Locator;

  constructor(page: Page) {
    this.page = page;
    this.textArea = page.locator("textarea");
    this.validateButton = page.getByRole("button", { name: /validate structure/i });
    this.example1Button = page.getByRole('button', { name: 'Example 1' });
    this.example2Button = page.getByRole('button', { name: 'Example 2' });
    this.example3Button = page.getByRole('button', { name: 'Example 3' });
    this.errorBox = page.locator(".sjp-errors");
    this.approveBox = page.locator('.sjp-approves');
    this.interactiveBox = page.locator(".sjp-int-gray-box");
    this.addStructureButton = page.locator(".sjp-add-structure");
    this.sliderOption = (option: string) => {
      return this.page.locator('.slider-option', { hasText: option });
    };
    }

  async goto() {
    await this.page.goto("/submitJob");
  }

  async fillTextArea(text: string) {
    await this.textArea.fill(text);
  }
  async clickValidate() {
    await this.validateButton.click();
  }
  async clickExample1() {
    await this.example1Button.click();
  }
  async clickExample2() {
    await this.example2Button.click();
  }
  async clickExample3() {
    await this.example3Button.click();
  }
  async selectInputFormat(option: string) {
    await this.sliderOption(option).click();
  }
  async addStructure() {
    await this.addStructureButton.click();
  }
  async fillStructure(index: number, value: string) {
    const textarea = this.interactiveBox.locator("textarea").nth(index);
    await textarea.fill(value);
  }
}
