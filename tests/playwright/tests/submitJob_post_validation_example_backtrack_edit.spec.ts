// tests/submitJob_postValidation_example_success.spec.ts
import { test, expect } from "@playwright/test";
import { SubmitJobPage } from "../pages/submitJobPage";
test.describe("SubmitJob full with example1 success", () => {
  test("Should do entirety of submitJob with example1 and backtrack with edit", 
  {
    annotation: [
      { type: 'bug', description: 'Veryfing old bug ' }
    ]
  }, async ({ page }) => {
    
    const submitJob = new SubmitJobPage(page);
    await submitJob.gotoAndValidate("CCGAGUAGGUA\n((.....))..",1)

    //NEXT
    
    await submitJob.next();
    await page.waitForSelector('.sjp-params-section');
    const seedItems = page.locator(".sjp-seed-name-param");
    const firstSeedCheckbox = page.locator('[data-testid="custom-checkbox"]').first();
    const secondSeedCheckbox = page.locator('[data-testid="custom-checkbox"]').nth(1);
    console.log("opacity");
    


    const firstOpacity = await firstSeedCheckbox.evaluate(el => window.getComputedStyle(el).opacity);
    expect(firstOpacity).not.toBe("1");
    const secondOpacity = await secondSeedCheckbox.evaluate(el => window.getComputedStyle(el).opacity);
    expect(secondOpacity).not.toBe("1");

    const NameText = seedItems.nth(0).locator('p');
    const text = await NameText.textContent();
    const SeedText = seedItems.nth(1).locator('p');
    const text2 = await SeedText.textContent();

    console.log("text:", text);
    console.log("text2:", text2);
    expect(text2?.trim()).toBe("Name example_job_1");
    await page.locator('button.button--primary-outlined', { hasText: 'Previous' }).click();
    await submitJob.fillTextArea("CCGAGUAGGUAa\n((.....))...");
    await submitJob.next();
    //NEXT

    
    const seedItemsPrev = page.locator(".sjp-seed-name-param");
    const firstSeedCheckboxPrev = seedItemsPrev.nth(0).locator('[data-testid="custom-checkbox"]');
    const secondSeedCheckboxPrev = seedItemsPrev.nth(1).locator('[data-testid="custom-checkbox"]');

    const firstOpacityPrev = await firstSeedCheckboxPrev.evaluate(
    el => window.getComputedStyle(el).opacity);
    console.log("First checkbox opacity:", firstOpacityPrev);
    expect(firstOpacityPrev).toBe("1");

    const secondOpacityPrev = await secondSeedCheckboxPrev.evaluate(
    el => window.getComputedStyle(el).opacity
    );
    console.log("Second checkbox opacity:", secondOpacityPrev);
    expect(secondOpacityPrev).toBe("1");

    const NameTextPrev = seedItemsPrev.nth(0).locator('p');
    const textPrev = await NameTextPrev.textContent();
    const SeedTextPrev = seedItemsPrev.nth(1).locator('p');
    const text2Prev = await SeedTextPrev.textContent();

    console.log("text:", textPrev);
    console.log("text2:", text2Prev);
    const firstSeedimg = seedItemsPrev.nth(0).locator('img');
    await firstSeedimg.scrollIntoViewIfNeeded();
    await firstSeedimg.hover();
    await page.waitForTimeout(500);
    await firstSeedimg.click();
    await page.waitForTimeout(400);
    const secondSeedimg = seedItemsPrev.nth(1).locator('img');
    await secondSeedimg.scrollIntoViewIfNeeded();
    await secondSeedimg.hover();
    await page.waitForTimeout(500);
    await secondSeedimg.click();
    await page.waitForTimeout(400);
    const jobNameField = page.locator('.textarea-wrapper textarea[placeholder="Enter custom job name"]');
    await jobNameField.fill("test123");

    const jobSeedField = page.locator('.textarea-wrapper textarea[placeholder="Enter custom seed"]');
    await jobSeedField.fill("54321");

    //NEXT i PREVIOUS
    await submitJob.next();
    await page.locator('button.button--primary-outlined', { hasText: 'Previous' }).click();


    const seedItemsPrev2 = page.locator(".sjp-seed-name-param");
    const firstSeedCheckboxPrev2 = seedItemsPrev2.nth(0).locator('[data-testid="custom-checkbox"]');
    const secondSeedCheckboxPrev2 = seedItemsPrev2.nth(1).locator('[data-testid="custom-checkbox"]');

    const firstOpacityPrev2 = await firstSeedCheckboxPrev2.evaluate(
    el => window.getComputedStyle(el).opacity
    );
    expect(firstOpacityPrev2).toBe("1");

    const secondOpacityPrev2 = await secondSeedCheckboxPrev2.evaluate(
    el => window.getComputedStyle(el).opacity
    );
    expect(secondOpacityPrev2).toBe("1");

    const NameTextPrev2 = seedItemsPrev2.nth(0).locator('p');
    const textPrev2 = await NameTextPrev2.textContent();
    const SeedTextPrev2 = seedItemsPrev2.nth(1).locator('p');
    const text2Prev2 = await SeedTextPrev2.textContent();
    const jobSeedFieldPrev = page.locator('.textarea-wrapper textarea[placeholder="Enter custom seed"]');
    const currentValueSeedPrev = await jobSeedFieldPrev.inputValue();
    const jobNameFieldPrev = page.locator('.textarea-wrapper textarea[placeholder="Enter custom job name"]');
    const currentValueNamePrev = await jobNameFieldPrev.inputValue();
    console.log("text:", currentValueSeedPrev);
    console.log("text2:", currentValueNamePrev);
    expect(currentValueNamePrev?.trim()).toBe("test123");
    expect(currentValueSeedPrev?.trim()).toBe("54321");
    await submitJob.next();


    //NEXT

    const emailInput = page.locator(".sjp-email-param textarea");
    await expect(emailInput).toBeVisible();
    await emailInput.fill("test@example.com");
    await page.locator('button.button--primary-filled', { hasText: 'Submit' }).click();

    await page.waitForURL(/\/results/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/results/);

  });
});