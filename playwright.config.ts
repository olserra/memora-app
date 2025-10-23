// Playwright config. Importing @playwright/test can cause type errors in
// environments where Playwright isn't installed. Export a plain JS-compatible
// config object so tsc won't require the Playwright types.

const config = {
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  // Note: devices won't be spread here when @playwright/test is not available.
  // If you run Playwright tests, install @playwright/test and restore devices usage.
  projects: [{ name: "chromium" }],
};

export default config;
