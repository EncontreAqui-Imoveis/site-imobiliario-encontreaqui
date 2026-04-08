import { defineConfig } from '@playwright/test'

const mockApiPort = 4010
const appPort = 3101

export default defineConfig({
    testDir: './e2e',
    timeout: 60_000,
    fullyParallel: false,
    workers: 1,
    expect: {
        timeout: 10_000,
    },
    use: {
        baseURL: `http://127.0.0.1:${appPort}`,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    webServer: [
        {
            command: `node e2e/mock-backend.cjs`,
            env: {
                ...process.env,
                MOCK_API_PORT: String(mockApiPort),
            },
            port: mockApiPort,
            reuseExistingServer: !process.env.CI,
        },
        {
            command: `npx next start -H 127.0.0.1 -p ${appPort}`,
            port: appPort,
            reuseExistingServer: !process.env.CI,
        },
    ],
})
