// Fail closed if a test accidentally imports the real infrastructure.
jest.mock('pg', () => { throw new Error('Tests must mock the database boundary'); });
jest.mock('dotenv', () => { throw new Error('Tests must not load environment files'); });
jest.mock('../src/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));
export const database = { query: jest.fn(), release: jest.fn() };
jest.mock('../src/db/db', () => ({ getDbClient: jest.fn(async () => database) }));

export const network = jest.fn(() => { throw new Error('Unexpected network call'); });
jest.mock('node-fetch', () => ({ __esModule: true, default: network }));
afterEach(() => expect(network).not.toHaveBeenCalled());
