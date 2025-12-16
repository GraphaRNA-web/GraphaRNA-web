// tests/submitJob_validation.spec.ts
//POPRAWIONE
import { test, expect } from "@playwright/test";
import { SubmitJobPage } from "../pages/submitJobPage";

test.describe("SubmitJob RNA Validation Blank", () => {
  test("Should show an errorwhen form is blank", async ({ page }) => {
    const submitJob = new SubmitJobPage(page);

    await submitJob.goto();
    await submitJob.fillTextArea("");
    await submitJob.clickValidate();

    await expect(submitJob.errorBox).toBeVisible();
    await expect(submitJob.errorBox).toContainText("Input cannot be empty.",{ timeout: 15000 });
  });
});

test.describe("SubmitJob RNA Validation Custom Example", () => {
  test("Should show success with custom made RNA", async ({ page }) => {
    const submitJob = new SubmitJobPage(page);

    await submitJob.goto();
    await submitJob.fillTextArea("CC\n..");
    await submitJob.clickValidate();

    await expect(submitJob.approveBox).toBeVisible({ timeout: 15000 });
    await expect(submitJob.approveBox).toHaveText("The structure is valid. You can now proceed with the job.",{ timeout: 15000 });
  });
});

test.describe("SubmitJob RNA Validation Example 1", () => {
  test("Should show success with example 1 RNA", async ({ page }) => {
    const submitJob = new SubmitJobPage(page);

    await submitJob.goto();
    await page.waitForTimeout(2000);
    await submitJob.clickExample1();
    // await expect(page.locator('textarea-wrapper')).toHaveText(/\S/, { timeout: 10000 });
    await submitJob.clickValidate();

    await expect(submitJob.approveBox).toBeVisible({ timeout: 15000 });
    await expect(submitJob.approveBox).toHaveText("The structure is valid. You can now proceed with the job.",{ timeout: 15000 });
  });
});

test.describe("SubmitJob RNA Validation Example 2", () => {
  test("Should show success with example 2 RNA", async ({ page }) => {
    const submitJob = new SubmitJobPage(page);

    await submitJob.goto();
    await page.waitForTimeout(2000);
    await submitJob.clickExample2();
    await submitJob.clickValidate();

    await expect(submitJob.approveBox).toBeVisible({ timeout: 15000 });
    await expect(submitJob.approveBox).toHaveText("The structure is valid. You can now proceed with the job.",{ timeout: 15000 });
  });
});

test.describe("SubmitJob RNA Validation Example 3", () => {
  test("Should show success with example 3 RNA", async ({ page }) => {
    const submitJob = new SubmitJobPage(page);

    await submitJob.goto();
    await page.waitForTimeout(2000);
    await submitJob.clickExample3();
    await submitJob.clickValidate();

    await expect(submitJob.approveBox).toBeVisible({ timeout: 15000 });
    await expect(submitJob.approveBox).toHaveText("The structure is valid. You can now proceed with the job.",{ timeout: 15000 });
  });
});


test.describe("SubmitJob invalid DotBRacket", () => {
  test("Should show inalid DotBracket", async ({ page }) => {
    const submitJob = new SubmitJobPage(page);

    await submitJob.goto();
    await submitJob.fillTextArea("GG\n&)");
    await submitJob.clickValidate();

    await expect(submitJob.errorBox).toBeVisible();
    await expect(submitJob.errorBox).toContainText("DotBracket contains invalid brackets: &",{ timeout: 15000 });
  });
});

test.describe("SubmitJob invalid RNA", () => {
  test("Should show inalid RNA", async ({ page }) => {
    const submitJob = new SubmitJobPage(page);

    await submitJob.goto();
    await page.waitForTimeout(2000);
    await submitJob.fillTextArea("GL\n..");
    await submitJob.clickValidate();

    await expect(submitJob.errorBox).toBeVisible();
    await expect(submitJob.errorBox).toContainText("RNA contains invalid characters: L",{ timeout: 15000 });
  });
});


