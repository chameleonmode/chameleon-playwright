import { PlaywrightTestConfig, devices } from "@playwright/test";
import path from "path";

const config: PlaywrightTestConfig = {
  testDir: "./tests",
  timeout: 30000,
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    actionTimeout: 0,
    trace: "on-first-retry",
    video: "on-first-retry",
    screenshot: "only-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: "firefox",
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: "webkit",
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    // Branded browsers
    {
      name: 'Microsoft Edge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge'
      },
    },
    {
      name: 'Google Chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        launchOptions: {
          executablePath: process.platform === "darwin"
            ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
            : undefined,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-gpu",
            "--window-size=1280,720"
          ],
        },
      },
    },
    {
      name: "chrome-persistent",
      use: {
        ...devices['Desktop Chrome'],
        channel: "chrome",
        viewport: { width: 1280, height: 720 },
        // We don't need launchOptions here because we're using launchPersistentContext in the tests
      },
    },
  ],
};

export default config;