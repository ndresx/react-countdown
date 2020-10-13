module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  snapshotSerializers: ['enzyme-to-json/serializer'],
  coveragePathIgnorePatterns: ['<rootDir>/config'],
  setupFilesAfterEnv: ['<rootDir>/config/setupTests.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/cypress/'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
};
