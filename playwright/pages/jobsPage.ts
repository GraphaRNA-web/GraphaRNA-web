import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./basePage";
import { ButtonElement } from "../elements/buttonElement";
import { TextElement } from "../elements/textElement";
import { VisualElement } from "../elements/visualElement";

export class JobsPage extends BasePage {
  // Selectors for the main sections
  private readonly activeSectionSelector =
    ".jobsPage-main:has(.jobsPage-title:has-text('Active jobs queue'))";
  private readonly finishedSectionSelector =
    ".jobsPage-main:has(.jobsPage-title:has-text('Finished jobs queue'))";

  // --- Global Elements ---
  readonly errorMessage: TextElement;

  // --- Active Jobs Elements ---
  readonly activeJobsTitle: TextElement;
  readonly startJobButton: ButtonElement;
  readonly guideButton: ButtonElement;
  readonly activeJobsSpinner: ButtonElement;
  readonly activeJobsTable: ButtonElement;
  readonly activePrevButton: ButtonElement;
  readonly activeNextButton: ButtonElement;

  // --- Finished Jobs Elements ---
  readonly finishedJobsTitle: TextElement;
  readonly finishedJobsSpinner: ButtonElement;
  readonly finishedJobsTable: ButtonElement;
  readonly finishedPrevButton: ButtonElement;
  readonly finishedNextButton: ButtonElement;

  constructor(page: Page) {
    super(page, undefined, "GraphaRNA-web", ".jobsPage-main");

    // --- Global Elements ---
    this.errorMessage = new TextElement("p.error", page);

    // --- Active Jobs Elements ---
    this.activeJobsTitle = new TextElement(
      `${this.activeSectionSelector} .jobsPage-title`,
      page
    );
    this.startJobButton = new ButtonElement(
      `${this.activeSectionSelector} button:has-text('Start a job')`,
      page
    );
    this.guideButton = new ButtonElement(
      `${this.activeSectionSelector} button:has-text('Guide')`,
      page
    );
    this.activeJobsSpinner = new ButtonElement(
      `${this.activeSectionSelector} .spinner`,
      page
    );

    this.activeJobsTable = new ButtonElement(
      `${this.activeSectionSelector} table`,
      page
    );
    this.activeNextButton = new ButtonElement(
      `${this.activeSectionSelector} .Jobs-Pagination button:has-text('Next >')`,
      this.page
    );
    this.activePrevButton = new ButtonElement(
      `${this.activeSectionSelector} .Jobs-Pagination button:has-text('< Previous')`,
      this.page
    );

    // --- Finished Jobs Elements ---
    this.finishedJobsTitle = new TextElement(
      `${this.finishedSectionSelector} .jobsPage-title`,
      page
    );
    this.finishedJobsSpinner = new ButtonElement(
      `${this.finishedSectionSelector} .spinner`,
      page
    );
    this.finishedJobsTable = new ButtonElement(
      `${this.finishedSectionSelector} table`,
      page
    );
    this.finishedPrevButton = new ButtonElement(
      `${this.finishedSectionSelector} .Jobs-Pagination button:has-text('< Previous')`,
      page
    );
    this.finishedNextButton = new ButtonElement(
      `${this.finishedSectionSelector} .Jobs-Pagination button:has-text('Next >')`,
      page
    );
  }

  
  async goto() {
    await this.openUrl("/jobs");
  }


 async waitForActiveJobsToLoad() {
    await expect(this.getActiveTableRows().nth(1)).toBeVisible();
  }

  async waitForFinishedJobsToLoad() {
    await expect(this.getFinishedTableRows().first()).toBeVisible();
  }

  
  async clickStartJob() {
    await this.startJobButton.click();
  }

  
  async clickGuide() {
    await this.guideButton.click();
  }

  
  getActiveTableRows(): Locator {
    return this.page.locator(`${this.activeSectionSelector} table tbody tr`);
  }

  
  getFinishedTableRows(): Locator {
    return this.page.locator(`${this.finishedSectionSelector} table tbody tr`);
  }

  
  getActivePageButton(pageNumber: number | string): ButtonElement {
    return new ButtonElement(
      `${this.activeSectionSelector} .Jobs-Pagination button:text-is("${pageNumber}")`,
      this.page
    );
  }

  
  getFinishedPageButton(pageNumber: number | string): ButtonElement {
    return new ButtonElement(
      `${this.finishedSectionSelector} .Jobs-Pagination button:text-is("${pageNumber}")`,
      this.page
    );
  }
}