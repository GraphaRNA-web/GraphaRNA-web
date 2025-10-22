
import { test, expect } from '@playwright/test';
import { PageManager } from '../pages/pageManager';
test.describe("Navigation Menu", () => {
    
    // Use a test hook to navigate before each test
    test.beforeEach(async ({ page, baseURL }) => {
        
        const urlToOpen = baseURL || "https://your-app-base-url.com/";
        await page.goto(urlToOpen);
    });

    test("should navigate to guide page", async ({ page }) => {
        
        const pm = new PageManager(page);
        const navPage = pm.onNavigationPage;

        await navPage.guide.validateElement(
            true,       // isEnabled: true
            true,       // isVisible: true
            "Guide"  
        );

        await navPage.toGuide();

        await expect(page).toHaveURL(/.*\/guide/, { timeout: 10000 });

    });

    
});