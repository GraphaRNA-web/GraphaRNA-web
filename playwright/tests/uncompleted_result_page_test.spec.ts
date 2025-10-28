

import { expect, request } from '@playwright/test';
import { test } from '../test-options';
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

  test.describe("Result Page Tests, Unfinished Job", () => {

    let createdJobs: string[] = [];
    let jobData: JobData = {
        fasta_file_name: "test1.fasta",
        seed: 123456,
        email: "user@example.com",
        alternative_conformations: 2,
        job_name: "playwright_test_job",
        job_status: "Q",
        sum_processing_time: 1,
      };


        

    test.beforeAll(async ({ request, backendUrl }) => {
      
      const jobResponse = await request.post(`${backendUrl}/api/test/setupTestJob/`, {
        data: jobData,
      });

      expect(jobResponse.ok()).toBeTruthy();

      const jobResponseJson = await jobResponse.json();
      if (!jobResponseJson.success) {
        throw new Error(`Failed to create test job: ${jobResponseJson.error}`);
      }

      createdJobs.push(jobResponseJson.job_uuid);
      jobData.job_uuid = jobResponseJson.job_uuid;
      jobData.job_hashed_uid = jobResponseJson.job_hashed_uid;

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

      await pageManager.onResultsPage.jobName.toHaveText(jobData.job_name);
      await pageManager.onResultsPage.seed.toHaveText(jobData.seed.toString());
      await pageManager.onResultsPage.processingInfo.toBeVisible();
      await pageManager.onResultsPage.statusLabel.toHaveText("queued");



    });

  });
