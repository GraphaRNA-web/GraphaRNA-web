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
    let jobData1: JobData = {
        fasta_file_name: "test1.fasta",
        seed: 123456,
        email: "user@example.com",
        alternative_conformations: 2,
        job_name: "playwright_test_job",
        job_status: "Q",
        sum_processing_time: 1,
      };


    

      let jobData2: JobData = {
        fasta_file_name: "test1.fasta",
        seed: 123456,
        email: "user@example.com",
        alternative_conformations: 2,
        job_name: "playwright_test_job",
        job_status: "R",
        sum_processing_time: 1,
      };

      let jobData3: JobData = {
        fasta_file_name: "test1.fasta",
        seed: 123456,
        email: "user@example.com",
        alternative_conformations: 2,
        job_name: "playwright_test_job",
        job_status: "C",
        sum_processing_time: 1,
      };

      let jobData4: JobData = {
        fasta_file_name: "test1.fasta",
        seed: 123456,
        email: "user@example.com",
        alternative_conformations: 2,
        job_name: "playwright_test_job",
        job_status: "C",
        sum_processing_time: 1,
      };

        

    test.beforeAll(async ({ request, backendUrl }) => {
        var j = 1;
         for (const jobData of [jobData1, jobData2, jobData3, jobData4]) {
           for (let i = 0; i < 10; i++) {
                jobData.job_name = `playwright_test_job_${j}_${jobData.job_status}`;
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
            }
            j++;
        }  
    });

    /* test.afterAll(async ({ request, backendUrl }) => {
      if (createdJobs.length > 0) {
        const deleteResponse = await request.delete(`${backendUrl}/api/test/cleanupTestData/`, {
          data: { hashed_uids: createdJobs },
        });
        createdJobs.length = 0; 
      }
    }); */


    test("should open jobs page and show jobs", async ({ pageManager, frontendUrl }) => {
        await pageManager.onJobsPage.goto();
        await pageManager.onJobsPage.waitForPageToLoad();
        await pageManager.onJobsPage.activeJobsTitle.toBeVisible();
        await pageManager.onJobsPage.finishedJobsTitle.toBeVisible();
        const activeRows = await pageManager.onJobsPage.getActiveTableRows().count();
        const finishedRows = await pageManager.onJobsPage.getFinishedTableRows().count();
        expect(activeRows).toBe(10);
        expect(finishedRows).toBe(10);
    });

    
  });

