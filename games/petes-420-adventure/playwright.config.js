const { defineConfig } = require('@playwright/test');

var phoneUa = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

module.exports = defineConfig({
  testDir: './tests',
  timeout: 45000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  retries: 0,
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off'
  },
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1',
    port: 4173,
    reuseExistingServer: true,
    cwd: __dirname
  },
  projects: [
    {
      name: 'desktop',
      use: { viewport: { width: 1280, height: 800 }, hasTouch: false, deviceScaleFactor: 1 }
    },
    {
      name: 'phone-portrait',
      use: {
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
        deviceScaleFactor: 1,
        userAgent: phoneUa
      }
    },
    {
      name: 'phone-landscape',
      use: {
        viewport: { width: 844, height: 390 },
        hasTouch: true,
        isMobile: true,
        deviceScaleFactor: 1,
        userAgent: phoneUa
      }
    }
  ]
});
