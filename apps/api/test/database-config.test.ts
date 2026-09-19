import { describe, expect, it } from 'vitest';
import { readDatabaseConfig } from '../src/infrastructure/database/database-config.js';

describe('readDatabaseConfig', () => {
  it('accepts an explicit MySQL connection URL', () => {
    expect(
      readDatabaseConfig({
        DATABASE_URL: 'mysql://app:secret@127.0.0.1:3306/shanheyipin'
      })
    ).toEqual({
      url: 'mysql://app:secret@127.0.0.1:3306/shanheyipin'
    });
  });

  it('rejects a missing database URL', () => {
    expect(() => readDatabaseConfig({})).toThrow('DATABASE_URL is required');
  });

  it('rejects non-MySQL database URLs', () => {
    expect(() =>
      readDatabaseConfig({ DATABASE_URL: 'postgresql://localhost/shanheyipin' })
    ).toThrow('DATABASE_URL must use mysql://');
  });
});
