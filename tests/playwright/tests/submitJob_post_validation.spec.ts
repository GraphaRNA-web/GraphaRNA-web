// tests/submitJob_postValidation.spec.ts
import { test, expect } from "@playwright/test";
import { SubmitJobPage } from "../pages/submitJobPage";

test.describe("SubmitJob post-validation", () => {

  test("should submit job successfully with valid email", async ({ page }) => {
    const submitJob = new SubmitJobPage(page);
    await submitJob.gotoAndValidate("CC\n..",undefined)
    await submitJob.next();

    //NEXT

    await page.waitForSelector(".sjp-params-section");
    const seedCheckbox = page
      .locator(".sjp-seed-name-param")
      .first()
      .locator('[data-testid="custom-checkbox"]');

    await expect(seedCheckbox).toBeVisible();

    const opacity = await seedCheckbox.evaluate(el =>
      window.getComputedStyle(el).opacity
    );
    expect(opacity).toBe("1");
    console.log("Seed checkbox opacity:", opacity);





    await submitJob.next();
    //NEXT
    const emailInput = page.locator(".sjp-email-param textarea");
    await expect(emailInput).toBeVisible();

    await emailInput.fill("test@example.com");
    await page.getByRole("button", { name: "Submit" }).click();

    await page.waitForURL(/\/results/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/results/);
  });

  test("should show validation error for invalid email", async ({ page }) => {
    const submitJob = new SubmitJobPage(page);
    await submitJob.goto();
    await submitJob.fillTextArea("CC\n..");
    await submitJob.clickValidate();

    await expect(submitJob.approveBox).toBeVisible({ timeout: 15000 });
    //NEXT
    await submitJob.next();
    await page.waitForSelector(".sjp-params-section");
    const seedValue = page.locator(".sjp-seed-name-param p span").first();
    const nameValue = page.locator(".sjp-seed-name-param p span").nth(1);
    await expect(seedValue).not.toHaveText("");
    await expect(nameValue).not.toHaveText("");
    const altField = page.locator(".sjp-alt-param input[type='number']");
    await expect(altField).toBeVisible();

    await submitJob.next();
    //NEXT
    const emailInput = page.locator(".sjp-email-param textarea");
    await expect(emailInput).toBeVisible();

    await emailInput.fill("BBBBGDFSDFSDESF");
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(submitJob.errorBox.first()).toContainText(
      "Invalid email address. Valid e-mail can contain only latin letters, numbers, '@' and '.'",
      { timeout: 15000 }
    );
  });

});
