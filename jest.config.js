module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  coveragePathIgnorePatterns: ['<rootDir>/config'],
  setupFilesAfterEnv: [
    '@testing-library/react/dont-cleanup-after-each.js',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/cypress/'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {diagnostics: false,}],
  },
};
