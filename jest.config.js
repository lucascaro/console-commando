module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    "<rootDir>/src/**/__tests__/*.+(ts|tsx|js)"
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/.*'
  ],
  collectCoverage: true,
};