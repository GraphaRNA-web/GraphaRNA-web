// tests/submitJob_validation_interactive.spec.ts
// giga G
import { test, expect } from "@playwright/test";
import { SubmitJobPage } from "../pages/submitJobPage";


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
    await expect(submitJob.approveBox).toHaveText("The structure is valid. You can now proceed with the job.",{ timeout: 15000 });

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


test.describe("SubmitJob interactive Both blank", () => {
  test("Should switch from Text to Interactive format and get validation error both blank", async ({ page }) => {
    const submitJob = new SubmitJobPage(page);

    await submitJob.goto();
    await expect(submitJob.textArea).toBeVisible();

    await submitJob.selectInputFormat("Interactive");
    await expect(submitJob.interactiveBox).toBeVisible();
    await submitJob.fillStructure(0, "");
    await submitJob.addStructure();
    await submitJob.fillStructure(1, "");

    const firstVal = await submitJob.interactiveBox.locator("textarea").nth(0).inputValue();
    const secondVal = await submitJob.interactiveBox.locator("textarea").nth(1).inputValue();

    expect(firstVal).toBe("");
    expect(secondVal).toBe("");

    await submitJob.clickValidate();
    await expect(submitJob.errorBox).toBeVisible();
    const errorMessages = await submitJob.errorBox.locator("li, p, div").allTextContents();
    expect(errorMessages.length).toBeGreaterThanOrEqual(2);
    expect(errorMessages).toContain("Structure 1 cannot be empty.");
    expect(errorMessages).toContain("Structure 2 cannot be empty.");
  });
});

test.describe("SubmitJob interactive Both invalid", () => {
  test("Should switch from Text to Interactive format and get validation error both invalid", async ({ page }) => {
    const submitJob = new SubmitJobPage(page);

    await submitJob.goto();
    await expect(submitJob.textArea).toBeVisible();

    await submitJob.selectInputFormat("Interactive");
    await expect(submitJob.interactiveBox).toBeVisible();
    await submitJob.fillStructure(0, "AB\n..");
    await submitJob.addStructure();
    await submitJob.fillStructure(1, "GG\n8)");

    const firstVal = await submitJob.interactiveBox.locator("textarea").nth(0).inputValue();
    const secondVal = await submitJob.interactiveBox.locator("textarea").nth(1).inputValue();

    expect(firstVal).toBe("AB\n..");
    expect(secondVal).toBe("GG\n8)");

    await submitJob.clickValidate();
    await expect(submitJob.errorBox).toBeVisible();
    const errorMessages = await submitJob.errorBox.locator("li, p, div").allTextContents();
    expect(errorMessages.length).toBeGreaterThanOrEqual(2);
    expect(errorMessages).toContain("RNA contains invalid characters: B");
    expect(errorMessages).toContain("DotBracket contains invalid brackets: 8");
  });
});