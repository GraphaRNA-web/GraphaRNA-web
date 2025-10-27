// playwright/tests/staticPages.spec.ts

import { test } from '../test-options'; // Używamy Twojego niestandardowego 'test'
import { expect } from '@playwright/test';

// Zestaw 1: Testy nawigacji
test.describe("Navigation on static pages", () => {

    test.beforeEach(async ({ page, baseURL }) => {
        const urlToOpen = baseURL || "http://127.0.0.1:3000/";
        await page.goto(urlToOpen);
    });

    test("navigate to Guide Page", async ({ page, pageManager }) => {
        await pageManager.onNavigationPage.guide.validateElement(true, true, "Guide");
        
        await Promise.all([
            page.waitForURL(/.*\/guide/),
            pageManager.onNavigationPage.toGuide()
        ]);
        
        await pageManager.onGuidePage.shouldBeOpened();
    });

    test("navigate to About Page", async ({ page, pageManager }) => {
        await pageManager.onNavigationPage.about.validateElement(true, true, "About");

        await Promise.all([
            page.waitForURL(/.*\/about/),
            pageManager.onNavigationPage.toAbout()
        ]);

        await pageManager.onAboutPage.shouldBeOpened();
    });

    test("navigate to Cite Page", async ({ page, pageManager }) => {
        await pageManager.onNavigationPage.cite.validateElement(true, true, "Cite Us");
        
        await Promise.all([
            page.waitForURL(/.*\/cite/),
            pageManager.onNavigationPage.toCite()
        ]);

        await pageManager.onCitePage.shouldBeOpened();
    });
});


test.describe("Content verification", () => {

    test("Homepage content check", async ({ page, pageManager, baseURL }) => {
        const urlToOpen = baseURL || "http://127.0.0.1:3000/";
        await page.goto(urlToOpen);
        
        const homePage = pageManager.onHomePage;
        await homePage.shouldBeOpened();

        await expect(homePage.introExplore).toHaveText("Explore");
        await expect(homePage.introWorld).toHaveText("the world of RNA");
        await expect(homePage.introGrapha).toHaveText("Grapha");
        await expect(homePage.description).toContainText("Lorem ipsum dolor sit amet");

        await homePage.startJobButton.validateElement(true, true, "Start a job");
        await homePage.guideButton.validateElement(true, true, "Guide");
    });

    test("Homepage button navigation", async ({ page, pageManager, baseURL }) => {
        const urlToOpen = baseURL || "http://127.0.0.1:3000/";
        await page.goto(urlToOpen);
        
        const homePage = pageManager.onHomePage;

        await Promise.all([
            page.waitForURL(/.*\/guide/),
            homePage.guideButton.click()
        ]);

        await pageManager.onGuidePage.shouldBeOpened();

        await page.goto(urlToOpen);

        await Promise.all([
            page.waitForURL(/.*\/submitJob/),
            homePage.startJobButton.click()
        ]);
        // When the page object will be added we could add:
        // await pageManager.onSubmitJobPage.shouldBeOpened(); 
    });

    test("About Page content check", async ({ page, pageManager, baseURL }) => {
        const urlToOpen = (baseURL || "http://127.0.0.1:3000/") + "about";
        await page.goto(urlToOpen);
        
        const aboutPage = pageManager.onAboutPage;
        await aboutPage.shouldBeOpened();

        await expect(aboutPage.title).toHaveText("About");
        await expect(aboutPage.authorsTitle).toHaveText("Authors");
        await expect(aboutPage.fundsTitle).toHaveText("Acknowledgements and Funding");
        
        await expect(aboutPage.authorsList).toContainText(["Marek Justyna", "Craig Zirbel", "Aleksandra Górska"]);
    });

    test("Cite Us content check", async ({ page, pageManager, baseURL }) => {
        const urlToOpen = (baseURL || "http://127.0.0.1:3000/") + "cite";
        await page.goto(urlToOpen);
        
        const citePage = pageManager.onCitePage;
        await citePage.shouldBeOpened();

        await expect(citePage.title).toHaveText("Cite us");
        await expect(citePage.subtitle).toContainText("Any published work which has made use of");
        await expect(citePage.citationText).toContainText("Justyna M, Zirbel CL, Antczak M, Szachniuk M (2025)");
    });

    test("Guide content check and anchor links", async ({ page, pageManager, baseURL }) => {
        const urlToOpen = (baseURL || "http://127.0.0.1:3000/") + "guide";
        await page.goto(urlToOpen);
        
        const guidePage = pageManager.onGuidePage;
        await guidePage.shouldBeOpened();

        await expect(guidePage.tocTitle).toHaveText("Guide Page content");
        await expect(guidePage.headerSubmitJob).toHaveText("1. How to submit a job");
        await expect(guidePage.tocList).toContainText("1. How to submit a job.");

        // NOWY TEST: Sprawdzenie scrollowania
        
        await guidePage.tocLinkViewJob.click();
        await expect(guidePage.headerViewJob).toBeInViewport({ timeout: 2000 });

        await guidePage.tocLinkJobsQueue.click();
        await expect(guidePage.headerJobsQueue).toBeInViewport({ timeout: 2000 });

        await guidePage.tocLinkSubmitJob.click();
        await expect(guidePage.headerSubmitJob).toBeInViewport({ timeout: 2000 });
    });
});