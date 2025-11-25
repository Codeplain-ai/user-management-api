module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  setupFilesAfterEnv: ['./jest.setup.js'],
  testTimeout: 120000,
  verbose: true,
  collectCoverage: false
};