// tests/submitJob_postValidation.spec.ts
import { test, expect } from "@playwright/test";
import { SubmitJobPage } from "../pages/submitJobPage";

test.describe("SubmitJob post-validation panel full", () => {
  test("Should show entirety of submitJob", async ({ page }) => {
    const submitJob = new SubmitJobPage(page);
    await submitJob.goto();
    await submitJob.fillTextArea("CC\n..");
    await submitJob.clickValidate();
    await expect(submitJob.approveBox).toBeVisible({ timeout: 15000 });
    await expect(submitJob.approveBox).toHaveText(
      "The structure is valid. You can now proceed with the job."
    );

    //NEXT

    await page.locator('button.button--primary-filled', { hasText: 'Next' }).click();

    const seedCheckbox = page.locator('.sjp-seed-name-param').first().locator('.custom-checkbox');
    await expect(seedCheckbox).toBeVisible({ timeout: 50000 });
    await seedCheckbox.waitFor({ state: 'attached', timeout: 5000 });
    const opacity = await seedCheckbox.evaluate(el => window.getComputedStyle(el).opacity);
    expect(opacity).toBe("1");
    console.log("Opacity:", opacity)
    await page.locator('button.button--primary-filled', { hasText: 'Next' }).click();

    //NEXT

    const emailInput = page.locator(".sjp-email-param textarea");
    await expect(emailInput).toBeVisible();
    await emailInput.fill("test@example.com");
    await page.locator('button.button--primary-filled', { hasText: 'Submit' }).click();

    await page.waitForURL(/\/results/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/results/);

  });
});


test.describe("SubmitJob post-validation invalid email", () => {
  test("Should show entirety of submitJob but with invalid email", async ({ page }) => {
    const submitJob = new SubmitJobPage(page);
    await submitJob.goto();
    await submitJob.fillTextArea("CC\n..");
    await submitJob.clickValidate();
    await expect(submitJob.approveBox).toBeVisible({ timeout: 150000 });
    await expect(submitJob.approveBox).toHaveText(
      "The structure is valid. You can now proceed with the job."
    );

    //NEXT

    await page.locator('button.button--primary-filled', { hasText: 'Next' }).click();
    const seedSpan = page.locator(".sjp-seed-name-param p span").first();
    await expect(seedSpan).toBeVisible();
    const seedValue = await seedSpan.textContent();
    console.log("Seed value:", seedValue);
    expect(seedValue).not.toBe("");
    const nameSpan = page.locator(".sjp-seed-name-param p span").nth(1);
    await expect(nameSpan).toBeVisible();
    const nameValue = await nameSpan.textContent();
    console.log("Job name:", nameValue);
    expect(nameValue).not.toBe("");
    const altField = page.locator(".sjp-alt-param input[type='number']");
    await expect(altField).toBeVisible();
    await page.locator('button.button--primary-filled', { hasText: 'Next' }).click();

    //NEXT

    const emailInput = page.locator(".sjp-email-param textarea");
    await expect(emailInput).toBeVisible();
    await emailInput.fill("BBBBGDFSDFSDESF");
    await page.locator('button.button--primary-filled', { hasText: 'Submit' }).click();
    await expect(submitJob.errorBox.first()).toContainText(
  "Invalid email address. Valid e-mail can contain only latin letters, numbers, '@' and '.'",
  { timeout: 15000 }
);


  });
});

