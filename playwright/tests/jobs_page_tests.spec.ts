// tests/testJobSetup.spec.ts
  import { expect, request } from '@playwright/test';
  import { test } from '../test-options';
  import { Console } from 'console';
  import { ResultsPage } from '../pages/resultsPage';

  type JobData = {
    fasta_file_name: string;
    seed: number;
    email: string;
    job_name: string;
    alternative_conformations: number;
    job_status: string;
    sum_processing_time: number;
    job_uuid?: string;
    job_hashed_uid?: string;
  };

  type JobResultsData = {
    job_uid?: string;
    result_secondary_structure_dotseq: string;
    result_secondary_structure_svg: string;
    result_tertiary_structure: string;
    result_arc_diagram: string;
    f1: number;
    inf: number;
    processing_time: number;
  };


  test.describe("Jobs Page Tests", () => {

    let createdJobs: string[] = [];
    let jobData1: JobData = { // Active - Queued
        fasta_file_name: "test1.fasta",
        seed: 123456,
        email: "user@example.com",
        alternative_conformations: 2,
        job_name: "playwright_test_job_Q",
        job_status: "Q",
        sum_processing_time: 1,
      };

      let jobData2: JobData = { // Active - Running
        fasta_file_name: "test1.fasta",
        seed: 123456,
        email: "user@example.com",
        alternative_conformations: 2,
        job_name: "playwright_test_job_R",
        job_status: "R",
        sum_processing_time: 1,
      };

      let jobData3: JobData = { // Finished - Completed
        fasta_file_name: "test1.fasta",
        seed: 123456,
        email: "user@example.com",
        alternative_conformations: 2,
        job_name: "playwright_test_job_C1",
        job_status: "C",
        sum_processing_time: 1,
      };

      let jobData4: JobData = { // Finished - Completed
        fasta_file_name: "test1.fasta",
        seed: 123456,
        email: "user@example.com",
        alternative_conformations: 2,
        job_name: "playwright_test_job_C2",
        job_status: "C",
        sum_processing_time: 1,
      };

        

    test.beforeAll(async ({ request, backendUrl }) => {
         for (const jobData of [jobData1, jobData2, jobData3, jobData4]) {
           for (let i = 0; i < 11; i++) { 
                const uniqueJobName = `${jobData.job_name}_${i}`;
                const jobDataWithUniqueName = { ...jobData, job_name: uniqueJobName };

                const jobResponse = await request.post(`${backendUrl}/api/test/setupTestJob/`, {
                    data: jobDataWithUniqueName,
                });

                expect(jobResponse.ok()).toBeTruthy();

                const jobResponseJson = await jobResponse.json();
                if (!jobResponseJson.success) {
                    throw new Error(`Failed to create test job: ${jobResponseJson.error}`);
                }

                createdJobs.push(jobResponseJson.job_hashed_uid);
            }
        }  
    });

     test.afterAll(async ({ request, backendUrl }) => {
      if (createdJobs.length > 0) {
        const deleteResponse = await request.delete(`${backendUrl}/api/test/cleanupTestData/`, {
          data: { hashed_uids: createdJobs },
        });
        createdJobs.length = 0; 
      }
    }); 


    test("should open jobs page and show initial jobs", async ({ pageManager }) => {
        await pageManager.onJobsPage.goto();
        await pageManager.onJobsPage.shouldBeOpened();
        await pageManager.onJobsPage.activeJobsTitle.toBeVisible();
        await pageManager.onJobsPage.finishedJobsTitle.toBeVisible();

        const activeRows = await pageManager.onJobsPage.getActiveTableRows().count();
        const finishedRows = await pageManager.onJobsPage.getFinishedTableRows().count();
        await expect(activeRows).toBe(10);
        await expect(finishedRows).toBe(10);
        
    });

    test("should show correct job data in the tables", async ({ pageManager }) => {
      await pageManager.onJobsPage.goto();
      await pageManager.onJobsPage.shouldBeOpened();

      await pageManager.onJobsPage.waitForActiveJobsToLoad();
      await pageManager.onJobsPage.waitForFinishedJobsToLoad();
      
      const activeTable = pageManager.onJobsPage.activeJobsTable.element();

      const myActiveRow = activeTable.locator("tr", { hasText: /playwright_test_job_(Q|R)/ }).first();

      await expect(myActiveRow.locator("td").nth(1)).toHaveText(/playwright_test_job_(Q|R)/);


      const finishedTable = pageManager.onJobsPage.finishedJobsTable.element();

      const myJobRow = finishedTable.locator("tr", { hasText: /playwright_test_job_C(1|2)/ }).first();

      await expect(myJobRow.locator("td").nth(0)).toHaveText(/playwright_test_job_C(1|2)/);

    });

    test("should navigate when clicking 'Start a job' button", async ({ page, pageManager }) => {
      await pageManager.onJobsPage.goto();
      await pageManager.onJobsPage.shouldBeOpened();

      await pageManager.onJobsPage.clickStartJob();
      
      await expect(page).toHaveURL("/submitJob");
    });

    test("should navigate when clicking 'Guide' button", async ({ page, pageManager }) => {
      await pageManager.onJobsPage.goto();
      await pageManager.onJobsPage.shouldBeOpened();

      await pageManager.onJobsPage.clickGuide();
      
      await expect(page).toHaveURL("/guide");
    });

    test("should paginate the active jobs table", async ({ pageManager }) => {
      await pageManager.onJobsPage.goto();
      await pageManager.onJobsPage.shouldBeOpened();

      // Get text of the first job name in the active table
      const firstRowLocator = pageManager.onJobsPage.getActiveTableRows().first().locator('td').nth(0);
      const firstPageJobName = await firstRowLocator.textContent();

      // Go to next page
      await pageManager.onJobsPage.activeNextButton.click();
      await pageManager.onJobsPage.waitForActiveJobsToLoad();

      // Check that the first job name is now different
      const secondPageJobName = await firstRowLocator.textContent();
      await expect(secondPageJobName).not.toBe(firstPageJobName);

      // We should now be on page 2
      await expect(pageManager.onJobsPage.getActivePageButton(2).element()).toHaveClass(/active/);
      // Go back to previous page
      await pageManager.onJobsPage.activePrevButton.click();
      await pageManager.onJobsPage.waitForActiveJobsToLoad();

      // Check that the job name is the same as the original first page
      const prevPageJobName = await firstRowLocator.textContent();
      await expect(prevPageJobName).toBe(firstPageJobName);

      // We should now be on page 1
      await expect(pageManager.onJobsPage.getActivePageButton(1).element()).toHaveClass(/active/);
    });

    test("should paginate the finished jobs table", async ({ pageManager }) => {
      await pageManager.onJobsPage.goto();
      await pageManager.onJobsPage.shouldBeOpened();

      // Get text of the first job name in the finished table
      const firstRowLocator = pageManager.onJobsPage.getFinishedTableRows().first().locator('td').nth(0);
      const firstPageJobName = await firstRowLocator.textContent();

      // Go to next page
      await pageManager.onJobsPage.finishedNextButton.click();
      await pageManager.onJobsPage.waitForFinishedJobsToLoad();

      // Check that the first job name is now different
      const secondPageJobName = await firstRowLocator.textContent();
      await expect(secondPageJobName).not.toBe(firstPageJobName);

      // We should now be on page 2
      await expect(pageManager.onJobsPage.getFinishedPageButton(2).element()).toHaveClass(/active/);

      // Go back to previous page
      await pageManager.onJobsPage.finishedPrevButton.click();
      await pageManager.onJobsPage.waitForFinishedJobsToLoad();

      // Check that the job name is the same as the original first page
      const prevPageJobName = await firstRowLocator.textContent();
      await expect(prevPageJobName).toBe(firstPageJobName);

      // We should now be on page 1
      await expect(pageManager.onJobsPage.getFinishedPageButton(1).element()).toHaveClass(/active/);
    });

  });