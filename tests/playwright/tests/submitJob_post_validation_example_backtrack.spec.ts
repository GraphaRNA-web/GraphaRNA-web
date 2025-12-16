// tests/submitJob_postValidation_example_success.spec.ts
import { test, expect } from "@playwright/test";
import { SubmitJobPage } from "../pages/submitJobPage";
test.describe("SubmitJob full with example1 success", () => {
  test("Should do entirety of submitJob with example1 and backtrack to ensure no autoSeed bug", async ({ page }) => {
    const submitJob = new SubmitJobPage(page);

    await submitJob.goto();
    await page.waitForTimeout(2000);
    await submitJob.clickExample1();
    await submitJob.fillTextArea("CCGAGUAGGUA\n((.....))..");
    await submitJob.clickValidate();
    await expect(submitJob.approveBox).toBeVisible({ timeout: 150000 });
    await expect(submitJob.approveBox).toHaveText(
      "The structure is valid. You can now proceed with the job."
    );

    //NEXT
    const seedItems = page.locator(".sjp-seed-name-param");
    await page.locator('button.button--primary-filled', { hasText: 'Next' }).click();
    const firstSeedCheckbox = seedItems.nth(0).locator('.custom-checkbox');
    const secondSeedCheckbox = seedItems.nth(1).locator('.custom-checkbox');

    const firstOpacity = await firstSeedCheckbox.evaluate(
    el => window.getComputedStyle(el).opacity
    );
    console.log("First checkbox opacity:", firstOpacity);
    expect(firstOpacity).not.toBe("1");

    const secondOpacity = await secondSeedCheckbox.evaluate(
    el => window.getComputedStyle(el).opacity
    );
    console.log("Second checkbox opacity:", secondOpacity);
    expect(secondOpacity).not.toBe("1");

    const NameText = seedItems.nth(0).locator('p');
    const text = await NameText.textContent();
    const SeedText = seedItems.nth(1).locator('p');
    const text2 = await SeedText.textContent();
    
    // const jobNameField = page.locator('.textarea-wrapper textarea[placeholder="Enter custom job name"]');
    // const currentValue = await jobNameField.inputValue();
    console.log("text:", text);
    console.log("text2:", text2);
    expect(text2?.trim()).toBe("Name example_job_1");
    await page.locator('button.button--primary-filled', { hasText: 'Next' }).click();
    await page.locator('button.button--primary-outlined', { hasText: 'Previous' }).click();
    const seedItemsPrev = page.locator(".sjp-seed-name-param");
    const firstSeedCheckboxPrev = seedItemsPrev.nth(0).locator('.custom-checkbox');
    const secondSeedCheckboxPrev = seedItemsPrev.nth(1).locator('.custom-checkbox');

    const firstOpacityPrev = await firstSeedCheckboxPrev.evaluate(
    el => window.getComputedStyle(el).opacity);
    console.log("First checkbox opacity:", firstOpacityPrev);
    expect(firstOpacityPrev).not.toBe("1");

    const secondOpacityPrev = await secondSeedCheckboxPrev.evaluate(
    el => window.getComputedStyle(el).opacity
    );
    console.log("Second checkbox opacity:", secondOpacityPrev);
    expect(secondOpacityPrev).not.toBe("1");

    const NameTextPrev = seedItems.nth(0).locator('p');
    const textPrev = await NameTextPrev.textContent();
    const SeedTextPrev = seedItems.nth(1).locator('p');
    const text2Prev = await SeedTextPrev.textContent();

    console.log("text:", textPrev);
    console.log("text2:", text2Prev);
    expect(text2Prev?.trim()).toBe("Name example_job_1");
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
  test("Should do entirety of submitJob with example1 and backtrack to ensure no autoSeed bug", async ({ page }) => {
    const submitJob = new SubmitJobPage(page);

    await submitJob.goto();
    await page.waitForTimeout(2000);
    await submitJob.clickExample1();
    await submitJob.fillTextArea("GACUUAUAGAU UGAGUCC\n(((((..(... )))))).");
    await submitJob.clickValidate();
    await expect(submitJob.approveBox).toBeVisible({ timeout: 150000 });
    await expect(submitJob.approveBox).toHaveText(
      "The structure is valid. You can now proceed with the job."
    );

    //NEXT
    const seedItems = page.locator(".sjp-seed-name-param");
    await page.locator('button.button--primary-filled', { hasText: 'Next' }).click();
    const firstSeedCheckbox = seedItems.nth(0).locator('.custom-checkbox');
    const secondSeedCheckbox = seedItems.nth(1).locator('.custom-checkbox');

    const firstOpacity = await firstSeedCheckbox.evaluate(
    el => window.getComputedStyle(el).opacity
    );
    console.log("First checkbox opacity:", firstOpacity);
    expect(firstOpacity).not.toBe("1");

    const secondOpacity = await secondSeedCheckbox.evaluate(
    el => window.getComputedStyle(el).opacity
    );
    console.log("Second checkbox opacity:", secondOpacity);
    expect(secondOpacity).not.toBe("1");

    const NameText = seedItems.nth(0).locator('p');
    const text = await NameText.textContent();
    const SeedText = seedItems.nth(1).locator('p');
    const text2 = await SeedText.textContent();
    console.log("text:", text);
    console.log("text2:", text2);
    expect(text2?.trim()).toBe("Name example_job_2");
    await page.locator('button.button--primary-filled', { hasText: 'Next' }).click();
    await page.locator('button.button--primary-outlined', { hasText: 'Previous' }).click();
    const seedItemsPrev = page.locator(".sjp-seed-name-param");
    const firstSeedCheckboxPrev = seedItemsPrev.nth(0).locator('.custom-checkbox');
    const secondSeedCheckboxPrev = seedItemsPrev.nth(1).locator('.custom-checkbox');

    const firstOpacityPrev = await firstSeedCheckboxPrev.evaluate(
    el => window.getComputedStyle(el).opacity);
    console.log("First checkbox opacity:", firstOpacityPrev);
    expect(firstOpacityPrev).not.toBe("1");

    const secondOpacityPrev = await secondSeedCheckboxPrev.evaluate(
    el => window.getComputedStyle(el).opacity
    );
    console.log("Second checkbox opacity:", secondOpacityPrev);
    expect(secondOpacityPrev).not.toBe("1");

    const NameTextPrev = seedItems.nth(0).locator('p');
    const textPrev = await NameTextPrev.textContent();
    const SeedTextPrev = seedItems.nth(1).locator('p');
    const text2Prev = await SeedTextPrev.textContent();

    console.log("text:", textPrev);
    console.log("text2:", text2Prev);
    expect(text2Prev?.trim()).toBe("Name example_job_2");
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
test.describe("SubmitJob full with example3 success", () => {
  test("Should do entirety of submitJob with example1 and backtrack to ensure no autoSeed bug", async ({ page }) => {
    const submitJob = new SubmitJobPage(page);

    await submitJob.goto();
    await page.waitForTimeout(2000);
    await submitJob.clickExample1();
    await submitJob.fillTextArea("UUAUGUGCC UGUUA AAUACAAUAG\n.....(... (.(.. ).....)..)");
    await submitJob.clickValidate();
    await expect(submitJob.approveBox).toBeVisible({ timeout: 150000 });
    await expect(submitJob.approveBox).toHaveText(
      "The structure is valid. You can now proceed with the job."
    );

    //NEXT
    const seedItems = page.locator(".sjp-seed-name-param");
    await page.locator('button.button--primary-filled', { hasText: 'Next' }).click();
    const firstSeedCheckbox = seedItems.nth(0).locator('.custom-checkbox');
    const secondSeedCheckbox = seedItems.nth(1).locator('.custom-checkbox');

    const firstOpacity = await firstSeedCheckbox.evaluate(
    el => window.getComputedStyle(el).opacity
    );
    console.log("First checkbox opacity:", firstOpacity);
    expect(firstOpacity).not.toBe("1");

    const secondOpacity = await secondSeedCheckbox.evaluate(
    el => window.getComputedStyle(el).opacity
    );
    console.log("Second checkbox opacity:", secondOpacity);
    expect(secondOpacity).not.toBe("1");

    const NameText = seedItems.nth(0).locator('p');
    const text = await NameText.textContent();
    const SeedText = seedItems.nth(1).locator('p');
    const text2 = await SeedText.textContent();
    console.log("text:", text);
    console.log("text2:", text2);
    expect(text2?.trim()).toBe("Name example_job_3");
    await page.locator('button.button--primary-filled', { hasText: 'Next' }).click();
    await page.locator('button.button--primary-outlined', { hasText: 'Previous' }).click();
    const seedItemsPrev = page.locator(".sjp-seed-name-param");
    const firstSeedCheckboxPrev = seedItemsPrev.nth(0).locator('.custom-checkbox');
    const secondSeedCheckboxPrev = seedItemsPrev.nth(1).locator('.custom-checkbox');

    const firstOpacityPrev = await firstSeedCheckboxPrev.evaluate(
    el => window.getComputedStyle(el).opacity);
    console.log("First checkbox opacity:", firstOpacityPrev);
    expect(firstOpacityPrev).not.toBe("1");

    const secondOpacityPrev = await secondSeedCheckboxPrev.evaluate(
    el => window.getComputedStyle(el).opacity
    );
    console.log("Second checkbox opacity:", secondOpacityPrev);
    expect(secondOpacityPrev).not.toBe("1");

    const NameTextPrev = seedItems.nth(0).locator('p');
    const textPrev = await NameTextPrev.textContent();
    const SeedTextPrev = seedItems.nth(1).locator('p');
    const text2Prev = await SeedTextPrev.textContent();

    console.log("text:", textPrev);
    console.log("text2:", text2Prev);
    expect(text2Prev?.trim()).toBe("Name example_job_3");
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