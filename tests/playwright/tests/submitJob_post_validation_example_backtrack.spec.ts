import { test, expect } from "@playwright/test";
import { SubmitJobPage } from "../pages/submitJobPage";

const examples = [
  {
    name: "example 1",
    input: "CCGAGUAGGUA\n((.....))..",
    expectedJobName: "Name example_job_1",
  },
  {
    name: "example 2",
    input: "GACUUAUAGAU UGAGUCC\n(((((..(... )))))).",
    expectedJobName: "Name example_job_2",
  },
  {
    name: "example 3",
    input: "UUAUGUGCC UGUUA AAUACAAUAG\n.....(... (.(.. ).....)..)",
    expectedJobName: "Name example_job_3",
  },
];

test.describe("SubmitJob with backtracking", () => {
  for (let i = 0; i < examples.length; i++) {
    const example = examples[i];
    test(`should work correctly for ${example.name}`,  {
    annotation: [
      { type: 'bug', description: 'Veryfing old bug ' }
    ]
  }, async ({ page }) => {
      const submitJob = new SubmitJobPage(page);

      await submitJob.gotoAndValidate(example.input,i+1)

      //NEXT
      const seedItems = page.locator(".sjp-seed-name-param");
      await submitJob.next();

      const firstSeedCheckbox = seedItems
        .nth(0)
        .locator('[data-testid="custom-checkbox"]');
      const secondSeedCheckbox = seedItems
        .nth(1)
        .locator('[data-testid="custom-checkbox"]');

      const firstOpacity = await firstSeedCheckbox.evaluate(el =>
        window.getComputedStyle(el).opacity
      );
      const secondOpacity = await secondSeedCheckbox.evaluate(el =>
        window.getComputedStyle(el).opacity
      );

      expect(firstOpacity).not.toBe("1");
      expect(secondOpacity).not.toBe("1");

      const seedText = await seedItems.nth(1).locator("p").textContent();
      expect(seedText?.trim()).toBe(example.expectedJobName);

      //NEXT i PREVIOUS
      await submitJob.next();
      await page.locator('button.button--primary-outlined', { hasText: "Previous" }).click();

      const firstOpacityPrev = await seedItems
        .nth(0)
        .locator('[data-testid="custom-checkbox"]')
        .evaluate(el => window.getComputedStyle(el).opacity);

      expect(firstOpacityPrev).not.toBe("1");

      //NEXT
      await submitJob.next();

      const emailInput = page.locator(".sjp-email-param textarea");
      await expect(emailInput).toBeVisible();
      await emailInput.fill("test@example.com");

      await page.locator('button.button--primary-filled', { hasText: "Submit" }).click();
      await page.waitForURL(/\/results/, { timeout: 10000 });
    });
  }
});
