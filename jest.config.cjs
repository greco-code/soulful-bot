/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }] },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  clearMocks: true,
};
