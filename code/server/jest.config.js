module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/**test**/**/*.test.ts', '**/**test**/*.test.ts'],
    reporters: ["default"],
    testTimeout: 30000,
}
