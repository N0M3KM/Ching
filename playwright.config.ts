import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./e2e',timeout:180000,workers:1,fullyParallel:false,
 use:{baseURL:'http://127.0.0.1:5174',viewport:{width:1440,height:1000},trace:'retain-on-failure',screenshot:'only-on-failure'},
 webServer:{command:'npm run dev',url:'http://127.0.0.1:5174',reuseExistingServer:!process.env.CI,timeout:60000},
});
