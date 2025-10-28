// tests/testJobSetup.spec.ts
import { expect, request } from '@playwright/test';
import { test } from '../test-options';
import { Console } from 'console';
import { ResultsPage } from '../pages/resultsPage';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

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


  test.describe("Zip download Tests, Finished Job, Multiple Results", () => {

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

    test("zip download contains all result files", async ({ page, pageManager, frontendUrl }) => {
    const resultsPage: ResultsPage = pageManager.onResultsPage;
    const jobHashedUid = jobData.job_hashed_uid!;
    await resultsPage.goto(`${frontendUrl}/results?uidh=${jobHashedUid}`);
    await resultsPage.waitForResultsToLoad();

    const downloadDir = path.resolve('./downloads');
  if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

    const [download] = await Promise.all([
        page.waitForEvent('download'),
        resultsPage.downloadZipButton.click(), 
    ]);

     const savedPath = path.join(downloadDir, download.suggestedFilename());
    await download.saveAs(savedPath);

    expect(fs.existsSync(savedPath)).toBeTruthy();
    const stats = fs.statSync(savedPath);
    expect(stats.size).toBeGreaterThan(0);


  const zip = new AdmZip(savedPath);
  const zipEntries = zip.getEntries().map(e => e.entryName);

  // Define expected filenames (based on your setup)
  const expectedFiles = [
    "test1.dotseq",
    "test1.svg",
    "test1.pdb",
    "test2.dotseq",
    "test2.svg",
    "test2.pdb",
    "test3.dotseq",
    "test3.svg",
    "test3.pdb"
  ];

  // Check that each expected file is present in the ZIP
  for (const expected of expectedFiles) {
    const [baseName, ext] = expected.split(".");
    const pattern = new RegExp(`^${baseName}.*\\.${ext}$`, "i"); // django may alter filenames to avoid conflicts, regex to match


    const found = zipEntries.some(entry => pattern.test(path.basename(entry)));
    expect(found).toBeTruthy();
  }


  });

});
