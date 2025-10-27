import { test as base } from "@playwright/test";
import { PageManager } from "./pages/pageManager";
// import { DatabaseClient } from "./config/database";

export type TestOptions = {
    globalUrl: string;
    pageManager: PageManager;
    dataBase: DatabaseClient;
};

export const test = base.extend<TestOptions>({
    globalUrl: ["", { option: true }],
    pageManager: async ({ page }, use) => {
        const pm = new PageManager(page);
        await use(pm);
    },
    dataBase: async ({}: any, use: (arg0: any) => any) => {
        const db = new DatabaseClient();
        await db.connect();
        await use(db);
    },
});
