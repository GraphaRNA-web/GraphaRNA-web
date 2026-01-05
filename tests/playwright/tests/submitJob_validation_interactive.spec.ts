// tests/submitJob_validation_interactive.spec.ts
import { test, expect } from "@playwright/test";
import { SubmitJobPage } from "../pages/submitJobPage";

type InteractiveCase = {
  name: string;
  structures: [string, string];
  expectedErrors?: string[];
  shouldPass?: boolean;
};

const cases: InteractiveCase[] = [
  {
    name: "valid structures",
    structures: ["CC\n..", "GG\n.."],
    shouldPass: true,
  },
  {
    name: "blank structure 1",
    structures: ["", "GG\n.."],
    expectedErrors: ["Structure 1 cannot be empty."],
  },
  {
    name: "blank structure 2",
    structures: ["CC\n..", ""],
    expectedErrors: ["Structure 2 cannot be empty."],
  },
  {
    name: "both blank",
    structures: ["", ""],
    expectedErrors: [
      "Structure 1 cannot be empty.",
      "Structure 2 cannot be empty.",
    ],
  },
  {
    name: "both invalid",
    structures: ["AB\n..", "GG\n8)"],
    expectedErrors: [
      "RNA contains invalid characters: B",
      "DotBracket contains invalid brackets: 8",
    ],
  },
];

test.describe("SubmitJob Interactive", () => {
  for (const testCase of cases) {
    test(`should handle interactive input – ${testCase.name}`, async ({ page }) => {
      const submitJob = new SubmitJobPage(page);
      await submitJob.goto();
      await expect(submitJob.textArea).toBeVisible();

      await submitJob.selectInputFormat("Interactive");
      await expect(submitJob.interactiveBox).toBeVisible();
      await submitJob.fillStructure(0, testCase.structures[0]);
      await submitJob.addStructure();
      await submitJob.fillStructure(1, testCase.structures[1]);

      const values = submitJob.interactiveBox.locator("textarea");
      await expect(values.nth(0)).toHaveValue(testCase.structures[0]);
      await expect(values.nth(1)).toHaveValue(testCase.structures[1]);

      await submitJob.clickValidate();

      if (testCase.shouldPass) {
        await expect(submitJob.approveBox).toBeVisible({ timeout: 15000 });
        await expect(submitJob.approveBox).toHaveText(
          "The structure is valid. You can now proceed with the job."
        );
      } else {
        await expect(submitJob.errorBox).toBeVisible({ timeout: 15000 });

        const errors = await submitJob.errorBox
          .locator("li, p, div")
          .allTextContents();

        for (const expectedError of testCase.expectedErrors!) {
          expect(errors).toContain(expectedError);
        }
      }
    });
  }
});
