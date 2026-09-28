/*global module */
/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: { allowJs: true } }],
  },
  transformIgnorePatterns: ['/node_modules/(?!(content-disposition)/)'],
};
