/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.prod.json', useESM: true }]
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/mailer.test.js', '/mailer.sandbox.test.js'],
  transformIgnorePatterns: ['node_modules/(?!(lowdb)/)']
};
