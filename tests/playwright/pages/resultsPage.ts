import { Page } from "@playwright/test";
import { BasePage } from "./basePage";
import { ButtonElement, getButtonElement } from "../elements/buttonElement";
import { TextElement } from "../elements/textElement";
import { BaseElement } from "../elements/baseElement";
import { VisualElement } from "../elements/visualElement";

export class ResultsPage extends BasePage {

  // Status / job details
  readonly statusLabel: TextElement;
  readonly totalProcessingTime: TextElement;
  readonly reportedDate: TextElement;
  readonly reportedTime: TextElement;

  // Download and metadata
  readonly downloadZipButton: ButtonElement;
  readonly jobName: TextElement;
  readonly seed: TextElement;

  // Input / result data
  readonly inputSecondaryStructure: TextElement;
  readonly resultSecondaryStructure: TextElement;
  readonly infValue: TextElement;
  readonly f1Value: TextElement;

  // Visual components
  readonly structure2D: VisualElement;
  readonly structure3D: VisualElement;
  readonly arcDiagram: VisualElement;

  // Info / messages
  readonly notFoundMessage: TextElement;
  readonly loadingInfo: TextElement;
  readonly processingInfo: TextElement;
  readonly errorInfo: TextElement;

  // Carousel buttons 
  readonly buttonContainer: ButtonElement[] = [];

  constructor(page: Page) {
    super(page, undefined, "GraphaRNA-web", ".whole-page");


    // Top section
    this.statusLabel = new TextElement(".status .field-value", page);
    this.totalProcessingTime = new TextElement(".proc-time .field-value", page);
    this.reportedDate = new TextElement(".rep-date .field-value", page);
    this.reportedTime = new TextElement(".rep-time .field-value", page);

    // Download & metadata
    this.downloadZipButton = getButtonElement(".download-zip", page);
    this.jobName = new TextElement(".job-name .field-value", page);
    this.seed = new TextElement(".seed .field-value", page);

    // Input and result data
    this.inputSecondaryStructure = new TextElement(".input-structure .input-value", page);
    this.resultSecondaryStructure = new TextElement(".result-structure .input-value", page);
    this.infValue = new TextElement(".inf-val .input-value2", page);
    this.f1Value = new TextElement(".f1-val .input-value2", page);

    // Visuals
    this.structure2D = new VisualElement('div[class="2d-image"] .viewer-container img[alt="Zoomable"]', page);
    this.structure3D = new VisualElement('div[class="3d-image"] .viewer-container canvas', page);
    this.arcDiagram = new VisualElement('div[class="arc-diagram"] .viewer-container img[alt="Zoomable"]', page);

    // Info / messages
    this.loadingInfo = new TextElement(".loading-info", page);
    this.notFoundMessage = new TextElement(".not-found .add-info", page);
    this.processingInfo = new TextElement(".not-finished .info", page);
    this.errorInfo = new TextElement(".job-failed .error-info", page);

    // Carousel buttons
    for (let i = 1; i <= 5; i++) {
      this.buttonContainer.push(new ButtonElement(`span:has-text('#${i}')`, this.page));
    }
  }

  async goto(url: string) {
    await this.openUrl(url);
  }

  

  async downloadResults() {
    await this.downloadZipButton.click();
  }

  async waitForResultsToLoad() {
    await this.statusLabel.toBeVisible();
  }

  async verifyJobCompleted() {
    await this.statusLabel.toContainText("completed");
  }
}
