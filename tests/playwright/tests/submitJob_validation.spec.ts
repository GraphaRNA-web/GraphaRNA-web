// tests/submitJob_validation.spec.ts
import { test, expect } from "@playwright/test";
import { SubmitJobPage } from "../pages/submitJobPage";

type ValidationCase = {
  name: string;
  setup?: (submitJob: SubmitJobPage) => Promise<void>;
  input?: string;
  example?: number;
  shouldPass: boolean;
  expectedText: string;
};

const cases: ValidationCase[] = [
  {
    name: "blank input",
    input: "",
    shouldPass: false,
    expectedText: "Input cannot be empty.",
  },
  {
    name: "custom valid RNA",
    input: "CC\n..",
    shouldPass: true,
    expectedText: "The structure is valid. You can now proceed with the job.",
  },
  {
    name: "example 1",
    example: 1,
    shouldPass: true,
    expectedText: "The structure is valid. You can now proceed with the job.",
  },
  {
    name: "example 2",
    example: 2,
    shouldPass: true,
    expectedText: "The structure is valid. You can now proceed with the job.",
  },
  {
    name: "example 3",
    example: 3,
    shouldPass: true,
    expectedText: "The structure is valid. You can now proceed with the job.",
  },
  {
    name: "invalid DotBracket",
    input: "GG\n&)",
    shouldPass: false,
    expectedText: "DotBracket contains invalid brackets: &",
  },
  {
    name: "invalid RNA",
    input: "GL\n..",
    shouldPass: false,
    expectedText: "RNA contains invalid characters: L",
  },
];

test.describe("SubmitJob validation", () => {
  for (const testCase of cases) {
    test(`should validate RNA – ${testCase.name}`, async ({ page }) => {
      const submitJob = new SubmitJobPage(page);

      await submitJob.goto();

      await page.waitForTimeout(2000);
      if (testCase.example) {
        await submitJob.selectExample(testCase.example);
      }

      if (testCase.input !== undefined) {
        await submitJob.fillTextArea(testCase.input);
      }

      await submitJob.clickValidate();

      if (testCase.shouldPass) {
        await expect(submitJob.approveBox).toBeVisible({ timeout: 15000 });
        await expect(submitJob.approveBox).toHaveText(testCase.expectedText);
      } else {
        await expect(submitJob.errorBox).toBeVisible({ timeout: 15000 });
        await expect(submitJob.errorBox).toContainText(testCase.expectedText);
      }
    });
  }
});
