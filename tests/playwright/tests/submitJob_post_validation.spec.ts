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

    // const seedItems = page.locator(".sjp-seed-name-param");
    const seedCheckbox = page.locator('.sjp-seed-name-param').first().locator('.custom-checkbox');
    await expect(seedCheckbox).toBeVisible({ timeout: 50000 });
    // await expect(seedCheckbox).toBeVisible({ timeout: 5000 }); // poczekaj aż widać element
    await seedCheckbox.waitFor({ state: 'attached', timeout: 5000 }); // opcjonalnie poczekaj na obecność w DOM
    // const opacity = await seedCheckbox.evaluate(el => window.getComputedStyle(el).opacity);

    const opacity = await seedCheckbox.evaluate(el => window.getComputedStyle(el).opacity);
    expect(opacity).toBe("1");
    console.log("Opacity:", opacity)
    // await expect(seedCheckbox).toBeEnabled();
    // const firstSeed = seedItems.nth(0).locator('img');
    // await firstSeed.scrollIntoViewIfNeeded();
    // await firstSeed.hover();
    // await page.waitForTimeout(500);
    // await firstSeed.click();
    // await page.waitForTimeout(400);
    // const secondSeed = seedItems.nth(1).locator('img');
    // await secondSeed.scrollIntoViewIfNeeded();
    // await secondSeed.hover();
    // await page.waitForTimeout(500);
    // await secondSeed.click();
    // await page.waitForTimeout(400);
    
    // const jobNameField = page.locator('.textarea-wrapper textarea[placeholder="Enter custom job name"]');
    // const currentValue = await jobNameField.inputValue();
    // console.log("Current job name:", currentValue);
    // await jobNameField.fill("my-new-job-name");
    // const newValue = await jobNameField.inputValue();
    // console.log("Updated job name:", newValue);

    // const seedSpan = page.locator(".sjp-seed-name-param p span").first();
    // await expect(seedSpan).toBeVisible();
    // const seedValue = await seedSpan.textContent();
    // console.log("Seed value:", seedValue);
    // expect(seedValue).not.toBe("");
    // const nameSpan = page.locator(".sjp-seed-name-param p span").nth(1);
    
    // await expect(nameSpan).toBeVisible();
    // const nameValue = await nameSpan.textContent();
    // console.log("Job name:", nameValue);
    // expect(nameValue).not.toBe("");
    // const altField = page.locator(".sjp-alt-param input[type='number']");
    // await expect(altField).toBeVisible();
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