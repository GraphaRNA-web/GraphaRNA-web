// tests/submitJob_postValidation_example_success.spec.ts
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

test.describe("SubmitJob full success)", () => {
  for (let i = 0; i < examples.length; i++) {
    const example = examples[i];
    test(`Should do entirety of submitJob with ${example.name}`,{
    annotation: [
      { type: 'success', description: 'SubmitJob full success with correct data' }
    ]
  }, async ({ page }) => {
      const submitJob = new SubmitJobPage(page);

      await submitJob.goto();
      await page.waitForTimeout(2000);

      await submitJob.selectExample(i+1);
      await submitJob.clickValidate();

      await expect(submitJob.approveBox).toBeVisible({ timeout: 150000 });
      await expect(submitJob.approveBox).toHaveText(
        "The structure is valid. You can now proceed with the job."
      );


      //NEXT
      await submitJob.next();
      await page.waitForTimeout(2000);
      await page.waitForSelector(".sjp-params-section");

      const seedCheckbox = page
        .locator(".sjp-seed-name-param")
        .first()
        .locator('[data-testid="custom-checkbox"]');

      const opacity = await seedCheckbox.evaluate(el =>
        window.getComputedStyle(el).opacity
      );

      expect(opacity).not.toBe("1");
      console.log(`[${example.name}] seed opacity:`, opacity);



      //NEXT
      await submitJob.next();

      const emailInput = page.locator(".sjp-email-param textarea");
      await expect(emailInput).toBeVisible({ timeout: 150000 });

      await emailInput.fill("test@example.com");
      await page.locator('button.button--primary-filled', { hasText: "Submit" }).click();

      await page.waitForURL(/\/results/, { timeout: 10000 });
      expect(page.url()).toMatch(/\/results/);
    });
  }
});
