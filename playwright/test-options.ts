import { test as base } from "@playwright/test";
import { PageManager } from "./pages/pageManager";
//import { DatabaseClient } from "./config/database";
import * as dotenv from "dotenv";
dotenv.config();

export type TestOptions = {
    frontendUrl: string;
    backendUrl: string;
    pageManager: PageManager;
    //dataBase: DatabaseClient;
};

export const test = base.extend<TestOptions>({
    frontendUrl: async ({ baseURL }, use) => {
        await use(baseURL || process.env.FRONTEND_URL || "http://127.0.0.1:3000");
    },
    backendUrl: async ({}, use) => {
        await use(process.env.BACKEND_URL || "http://localhost:8000");
    },
    pageManager: async ({ page }, use) => {
        const pm = new PageManager(page);
        await use(pm);
    },
    /*dataBase: async ({}: any, use: (arg0: any) => any) => {
        const db = new DatabaseClient();
        await db.connect();
        await use(db);
    },*/
});
