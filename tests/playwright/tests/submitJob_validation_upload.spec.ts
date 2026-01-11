// tests/submitJob_validation_upload.spec.ts
import path from "path";
import { test, expect } from "@playwright/test";
import { SubmitJobPage } from "../pages/submitJobPage";

test.describe("SubmitJob File upload", () => {
  test("Should switch to File format, upload .fasta file and go next", async ({ page }) => {
    const submitJob = new SubmitJobPage(page);

    await submitJob.goto();
    await expect(submitJob.textArea).toBeVisible();
    await submitJob.selectInputFormat("File");
    const grayBox = page.locator(".sjp-int-gray-box");
    await expect(grayBox).toBeVisible();
    await expect(grayBox).toContainText("A valid file should be in .fasta format.");

    const uploadButton = page.getByRole("button", { name: /Upload File/i });
    await uploadButton.click();

    const fileInput = page.locator('input[type="file"]');
    const fastaPath = path.resolve(__dirname, "../data/example.fasta");
    await fileInput.setInputFiles(fastaPath, { force: true });

    await page.locator("#modal-upload-button").click();
    await submitJob.clickValidate();
    await expect(submitJob.approveBox).toHaveText("The structure is valid. You can now proceed with the job.",{ timeout: 15000 });
  });
});
