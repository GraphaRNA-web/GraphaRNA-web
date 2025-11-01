
import { expect } from '@playwright/test';
import { PageManager } from '../pages/pageManager';
import { test } from '../test-options';
test.describe("Navigation Menu", () => {
    
    // Use a test hook to navigate before each test
    test.beforeEach(async ({ page, baseURL }) => {
        
        const urlToOpen = baseURL || "https://your-app-base-url.com/";
        console.log("Navigating to:", urlToOpen);

        await page.goto(urlToOpen);
    });

    test("should navigate to guide page", async ({ pageManager }) => {
        

        await pageManager.onNavigationPage.guide.validateElement(
            true,       // isEnabled: true
            true,       // isVisible: true
            "Guide"  
        );

        await pageManager.onNavigationPage.toGuide();

        await expect(pageManager.currentPage).toHaveURL(/.*\/guide/, { timeout: 10000 });

    });

    
});