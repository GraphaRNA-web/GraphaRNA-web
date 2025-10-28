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


  test.describe("Result Page Tests, Finished Job, Multiple Results", () => {

    let createdJobs: string[] = [];
    let jobData: JobData = {
        fasta_file_name: "test1.fasta",
        seed: 123456,
        email: "user@example.com",
        alternative_conformations: 2,
        job_name: "playwright_test_job",
        job_status: "C",
        sum_processing_time: 1,
      };


          const jobResultsArray: JobResultsData[] = [
        {
          result_secondary_structure_dotseq: "test1.dotseq",
          result_secondary_structure_svg: "test1.svg",
          result_tertiary_structure: "test1.pdb",
          result_arc_diagram: "test1.svg",
          f1: 0.95,
          inf: 0.9,
          processing_time: 1,
        },
        {
          result_secondary_structure_dotseq: "test2.dotseq",
          result_secondary_structure_svg: "test2.svg",
          result_tertiary_structure: "test2.pdb",
          result_arc_diagram: "test2.svg",
          f1: 0.92,
          inf: 0.88,
          processing_time: 2,
        },
        {
          result_secondary_structure_dotseq: "test3.dotseq",
          result_secondary_structure_svg: "test3.svg",
          result_tertiary_structure: "test3.pdb",
          result_arc_diagram: "test3.svg",
          f1: 0.89,
          inf: 0.85,
          processing_time: 3,
        },
      ];

    test.beforeAll(async ({ request, backendUrl }) => {
      
      const jobResponse = await request.post(`${backendUrl}/api/test/setupTestJob/`, {
        data: jobData,
      });

      expect(jobResponse.ok()).toBeTruthy();

      const jobResponseJson = await jobResponse.json();
      if (!jobResponseJson.success) {
        throw new Error(`Failed to create test job: ${jobResponseJson.error}`);
      }

      createdJobs.push(jobResponseJson.job_hashed_uid);
      jobData.job_uuid = jobResponseJson.job_uuid;
      jobData.job_hashed_uid = jobResponseJson.job_hashed_uid;


      for (const jobResult of jobResultsArray) {
        jobResult.job_uid = jobData.job_uuid;
        const resultsResponse = await request.post(`${backendUrl}/api/test/setupTestJobResults/`, {
          data: jobResult,
        });

        expect(resultsResponse.ok()).toBeTruthy();

        const resultsJson = await resultsResponse.json();
        if (!resultsJson.success) {
          throw new Error(`Failed to create test job results: ${resultsJson.error}`);
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


    test("should open result page and show results", async ({ pageManager, frontendUrl }) => {
      await pageManager.onResultsPage.goto(`${frontendUrl}/results?uidh=${jobData.job_hashed_uid}`);
      
      await pageManager.onResultsPage.waitForResultsToLoad();
      await pageManager.onResultsPage.verifyJobCompleted();

      await pageManager.onResultsPage.f1Value.toHaveText(jobResultsArray[0].f1.toFixed(3).toString());
      await pageManager.onResultsPage.infValue.toHaveText(jobResultsArray[0].inf.toFixed(3).toString());
      
      await pageManager.onResultsPage.jobName.toHaveText(jobData.job_name);
      await pageManager.onResultsPage.seed.toHaveText(jobData.seed.toString());


      await pageManager.onResultsPage.structure2D.toBeVisible();
      await pageManager.onResultsPage.arcDiagram.toBeVisible();
      // there are two canvas elements rendered for 3D structure, explicitly select the first one
      await expect(pageManager.onResultsPage.structure3D.element().first()).toBeVisible();

      await pageManager.onResultsPage.structure2D.toHaveScreenshot("2d_image.png", { maxDiffPixelRatio: 0.05 });
      await pageManager.onResultsPage.arcDiagram.toHaveScreenshot("arc_diagram.png" , { maxDiffPixelRatio: 0.05 });
      // there are two canvas elements rendered for 3D structure, explicitly select the first one
      await expect(pageManager.onResultsPage.structure3D.element().first()).toHaveScreenshot("3d_image.png", { maxDiffPixelRatio: 0.05 });
      
    });

    test("carusel displays multiple results and switches between them correctly", async ({ pageManager, frontendUrl }) => {
      await pageManager.onResultsPage.goto(`${frontendUrl}/results?uidh=${jobData.job_hashed_uid}`);
      await pageManager.onResultsPage.waitForResultsToLoad();
      await pageManager.onResultsPage.verifyJobCompleted();
      
      
      for (let i = 0; i < jobResultsArray.length; i++) {
        const jobResult = jobResultsArray[i];
        await pageManager.onResultsPage.f1Value.toHaveText(jobResult.f1.toFixed(3).toString());
        await pageManager.onResultsPage.infValue.toHaveText(jobResult.inf.toFixed(3).toString());
        await pageManager.onResultsPage.structure2D.toBeVisible();
        await pageManager.onResultsPage.arcDiagram.toBeVisible();
        // there are two canvas elements rendered for 3D structure, explicitly select the first one
        await expect(pageManager.onResultsPage.structure3D.element().first()).toBeVisible();

        await pageManager.onResultsPage.structure2D.toHaveScreenshot("2d_image.png", { maxDiffPixelRatio: 0.05 });
        await pageManager.onResultsPage.arcDiagram.toHaveScreenshot("arc_diagram.png", { maxDiffPixelRatio: 0.05 });
        // there are two canvas elements rendered for 3D structure, explicitly select the first one
        await expect(pageManager.onResultsPage.structure3D.element().first()).toHaveScreenshot("3d_image.png", { maxDiffPixelRatio: 0.05 });
        await pageManager.onResultsPage.nextButton.toBeVisible();
        await pageManager.onResultsPage.nextButton.click();
      }
    });
  });

