/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ['<rootDir>/src'],
    testTimeout: 20000,         // ⏱️ Increase test timeout to 20 seconds
};