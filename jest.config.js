/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.cjs'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'CommonJS',
          moduleResolution: 'Node',
          isolatedModules: true
        },
        diagnostics: { ignoreCodes: [151002] }
      }
    ]
  },
  moduleNameMapper: {
    // Allow importing TS files that use ESM-style .js suffix in paths
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};


