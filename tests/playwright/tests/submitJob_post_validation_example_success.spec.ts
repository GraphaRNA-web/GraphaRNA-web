// tests/submitJob_postValidation_example_success.spec.ts
import { test, expect } from "@playwright/test";
import { SubmitJobPage } from "../pages/submitJobPage";
test.describe("SubmitJob full with example1 success", () => {
  test("Should do entirety of submitJob with example1", async ({ page }) => {
    const submitJob = new SubmitJobPage(page);

    await submitJob.goto();
    await page.waitForTimeout(2000);
    await submitJob.clickExample1();
    await submitJob.clickValidate();
    await expect(submitJob.approveBox).toBeVisible({ timeout: 150000 });
    await expect(submitJob.approveBox).toHaveText(
      "The structure is valid. You can now proceed with the job."
    );

    //NEXT

    await page.locator('button.button--primary-filled', { hasText: 'Next' }).click();
    const seedCheckbox = page.locator('.sjp-seed-name-param').first().locator('.custom-checkbox');
    const opacity = await seedCheckbox.evaluate(el => window.getComputedStyle(el).opacity);
    expect(opacity).not.toBe("1");
    console.log("Opacity:", opacity);
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

test.describe("SubmitJob full with example2 success", () => {
  test("Should do entirety of submitJob with example2", async ({ page }) => {
    const submitJob = new SubmitJobPage(page);

    await submitJob.goto();
    await page.waitForTimeout(2000);
    await submitJob.clickExample2();
    await submitJob.clickValidate();
    await expect(submitJob.approveBox).toBeVisible({ timeout: 15000 });
    await expect(submitJob.approveBox).toHaveText(
      "The structure is valid. You can now proceed with the job."
    );

    //NEXT

    await page.locator('button.button--primary-filled', { hasText: 'Next' }).click();
    const seedCheckbox = page.locator('.sjp-seed-name-param').first().locator('.custom-checkbox');
    const opacity = await seedCheckbox.evaluate(el => window.getComputedStyle(el).opacity);
    expect(opacity).not.toBe("1");
    console.log("Opacity:", opacity);
    await page.locator('button.button--primary-filled', { hasText: 'Next' }).click();

    //NEXT

    const emailInput = page.locator(".sjp-email-param textarea");
    await expect(emailInput).toBeVisible( {timeout: 150000 });
    await emailInput.fill("test@example.com");
    await page.locator('button.button--primary-filled', { hasText: 'Submit' }).click();

    await page.waitForURL(/\/results/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/results/);

  });
});
test.describe("SubmitJob full with example3 success", () => {
  test("Should do entirety of submitJob with example3", async ({ page }) => {
    const submitJob = new SubmitJobPage(page);

    await submitJob.goto();
    await page.waitForTimeout(2000);
    await submitJob.clickExample3();
    await submitJob.clickValidate();
    await expect(submitJob.approveBox).toBeVisible({ timeout: 150000 });
    await expect(submitJob.approveBox).toHaveText(
      "The structure is valid. You can now proceed with the job."
    );

    //NEXT

    await page.locator('button.button--primary-filled', { hasText: 'Next' }).click();
    const seedCheckbox = page.locator('.sjp-seed-name-param').first().locator('.custom-checkbox');
    const opacity = await seedCheckbox.evaluate(el => window.getComputedStyle(el).opacity);
    expect(opacity).not.toBe("1");
    console.log("Opacity:", opacity);
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