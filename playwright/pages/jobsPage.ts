import { Page, Locator } from "@playwright/test";
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
  readonly activeJobsSpinner: VisualElement;
  readonly activeJobsTable: VisualElement;
  readonly activePagination: VisualElement;
  readonly activePrevButton: ButtonElement;
  readonly activeNextButton: ButtonElement;

  // --- Finished Jobs Elements ---
  readonly finishedJobsTitle: TextElement;
  readonly finishedJobsSpinner: VisualElement;
  readonly finishedJobsTable: VisualElement;
  readonly finishedPagination: VisualElement;
  readonly finishedPrevButton: ButtonElement;
  readonly finishedNextButton: ButtonElement;

  constructor(page: Page) {
    super(page, undefined, "GraphaRNA-web", ".top-left");

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
    this.activeJobsSpinner = new VisualElement(
      `${this.activeSectionSelector} .spinner`,
      page
    );

    this.activeJobsTable = new VisualElement(
      `${this.activeSectionSelector} table`,
      page
    );
    this.activePagination = new VisualElement(
      `${this.activeSectionSelector} .pagination`,
      page
    );
    this.activePrevButton = new ButtonElement(
      `${this.activeSectionSelector} .pagination button:has-text('< Previous')`,
      page
    );
    this.activeNextButton = new ButtonElement(
      `${this.activeSectionSelector} .pagination button:has-text('Next >')`,
      page
    );

    // --- Finished Jobs Elements ---
    this.finishedJobsTitle = new TextElement(
      `${this.finishedSectionSelector} .jobsPage-title`,
      page
    );
    this.finishedJobsSpinner = new VisualElement(
      `${this.finishedSectionSelector} .spinner`,
      page
    );
    // Assumes JobsTable renders a <table> element
    this.finishedJobsTable = new VisualElement(
      `${this.finishedSectionSelector} table`,
      page
    );
    this.finishedPagination = new VisualElement(
      `${this.finishedSectionSelector} .pagination`,
      page
    );
    this.finishedPrevButton = new ButtonElement(
      `${this.finishedSectionSelector} .pagination button:has-text('< Previous')`,
      page
    );
    this.finishedNextButton = new ButtonElement(
      `${this.finishedSectionSelector} .pagination button:has-text('Next >')`,
      page
    );
  }

  
  async goto() {
    await this.openUrl("/jobs");
  }

  
  async waitForPageToLoad() {
    await this.activeJobsSpinner.toBeHidden();
    await this.finishedJobsSpinner.toBeHidden();
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
      `${this.activeSectionSelector} .pagination button:text-is("${pageNumber}")`,
      this.page
    );
  }

  
  getFinishedPageButton(pageNumber: number | string): ButtonElement {
    return new ButtonElement(
      `${this.finishedSectionSelector} .pagination button:text-is("${pageNumber}")`,
      this.page
    );
  }
}