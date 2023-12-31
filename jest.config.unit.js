module.exports = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-node',
  testMatch: ['**/__tests__/**/*.unit.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/index.ts',
    '!src/**/*.config.ts',
    '!src/**/config.ts',
    '!**/entity.ts',
    '!**/query-model.ts',
    '!**/smart-contract-service.ts',
    '!**/use-case.ts',
    '!**/*.repository.ts',
    '!**/*.fixture.ts',
    '!**/*.mock.ts',
    '!**/*.error.ts',
    '!**/*.errors.ts',
    '!**/__tests__/**',
    '!**/__mocks__/**',
    '!src/**/*.enums.ts',
    '!src/**/*.dtos.ts',
    '!src/**/*.types.ts',
    '!src/**/repository.ts',
    '!src/**/collection.source.ts'
  ],
};
