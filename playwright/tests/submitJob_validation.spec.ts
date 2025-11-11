// tests/submitJob_validation.spec.ts
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
    await expect(submitJob.approveBox).toHaveText("Validation passed successfully. Input was parsed to the engine's format.",{ timeout: 15000 });
  });
});

test.describe("SubmitJob RNA Validation Example 1", () => {
  test("Should show success with example 1 RNA", async ({ page }) => {
    const submitJob = new SubmitJobPage(page);

    await submitJob.goto();
    await submitJob.clickExample1();
    await submitJob.clickValidate();

    await expect(submitJob.approveBox).toBeVisible({ timeout: 15000 });
    await expect(submitJob.approveBox).toHaveText("Validation passed successfully. Input was parsed to the engine's format.",{ timeout: 15000 });
  });
});

test.describe("SubmitJob RNA Validation Example 2", () => {
  test("Should show success with example 2 RNA", async ({ page }) => {
    const submitJob = new SubmitJobPage(page);

    await submitJob.goto();
    await submitJob.clickExample2();
    await submitJob.clickValidate();

    await expect(submitJob.approveBox).toBeVisible({ timeout: 15000 });
    await expect(submitJob.approveBox).toHaveText("Validation passed successfully. Input was parsed to the engine's format.",{ timeout: 15000 });
  });
});

test.describe("SubmitJob RNA Validation Example 3", () => {
  test("Should show success with example 3 RNA", async ({ page }) => {
    const submitJob = new SubmitJobPage(page);

    await submitJob.goto();
    await submitJob.clickExample3();
    await submitJob.clickValidate();

    await expect(submitJob.approveBox).toBeVisible({ timeout: 15000 });
    await expect(submitJob.approveBox).toHaveText("Validation passed successfully. Input was parsed to the engine's format.",{ timeout: 15000 });
  });
});


test.describe("SubmitJob interactive validation error", () => {
  test("Should switch from text to Interactive format and succesfully validate", async ({ page }) => {
    const submitJob = new SubmitJobPage(page);

    await submitJob.goto();
    await expect(submitJob.textArea).toBeVisible();
    await submitJob.selectInputFormat("Interactive");
    await expect(submitJob.interactiveBox).toBeVisible();
    await submitJob.fillStructure(0, "CC\n..");
    await submitJob.addStructure();
    await submitJob.fillStructure(1, "GG\n..");

    const firstVal = await submitJob.interactiveBox.locator("textarea").nth(0).inputValue();
    const secondVal = await submitJob.interactiveBox.locator("textarea").nth(1).inputValue();

    expect(firstVal).toBe("CC\n..");
    expect(secondVal).toBe("GG\n..");

    await submitJob.clickValidate();
    await expect(submitJob.approveBox).toBeVisible({ timeout: 15000 });
    await expect(submitJob.approveBox).toHaveText("Validation passed successfully. Input was parsed to the engine's format.",{ timeout: 15000 });

  });

});



test.describe("SubmitJob interactive blank 1 ", () => {
  test("Should switch from Text to Interactive format and get validation error blank Structure 1 ", async ({ page }) => {
    const submitJob = new SubmitJobPage(page);

    await submitJob.goto();
    await expect(submitJob.textArea).toBeVisible();
    await submitJob.selectInputFormat("Interactive");
    await expect(submitJob.interactiveBox).toBeVisible();
    await submitJob.fillStructure(0, "");
    await submitJob.addStructure();
    await submitJob.fillStructure(1, "GG\n..");

    const firstVal = await submitJob.interactiveBox.locator("textarea").nth(0).inputValue();
    const secondVal = await submitJob.interactiveBox.locator("textarea").nth(1).inputValue();

    expect(firstVal).toBe("");
    expect(secondVal).toBe("GG\n..");

    await submitJob.clickValidate();
    await expect(submitJob.errorBox).toBeVisible();
    await expect(submitJob.errorBox).toContainText("Structure 1 cannot be empty.",{ timeout: 15000 });
  });
});


test.describe("SubmitJob interactive blank 2", () => {
  test("Should switch from Text to Interactive format and get validation error blank Structure 2", async ({ page }) => {
    const submitJob = new SubmitJobPage(page);

    await submitJob.goto();
    await expect(submitJob.textArea).toBeVisible();
    await submitJob.selectInputFormat("Interactive");
    await expect(submitJob.interactiveBox).toBeVisible();
    await submitJob.fillStructure(0, "CC\n..");
    await submitJob.addStructure();
    await submitJob.fillStructure(1, "");

    const firstVal = await submitJob.interactiveBox.locator("textarea").nth(0).inputValue();
    const secondVal = await submitJob.interactiveBox.locator("textarea").nth(1).inputValue();

    expect(firstVal).toBe("CC\n..");
    expect(secondVal).toBe("");

    await submitJob.clickValidate();
    await expect(submitJob.errorBox).toBeVisible();
    await expect(submitJob.errorBox).toContainText("Structure 2 cannot be empty.",{ timeout: 15000 });
  });
});