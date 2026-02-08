const nextJest = require('next/jest')

const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
    dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jest-environment-jsdom',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^firebase/auth$': '<rootDir>/__mocks__/firebase/auth.js',
        '^firebase/app$': '<rootDir>/__mocks__/firebase/app.js',
        '\\.(css|less|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',

        '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    },
    transformIgnorePatterns: [
        '/node_modules/(?!firebase|@firebase|lucide-react)/',
    ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
