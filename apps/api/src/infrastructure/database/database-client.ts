import { PrismaClient } from '@prisma/client';
import { readDatabaseConfig } from './database-config.js';

export function createDatabaseClient(
  env: Readonly<Record<string, string | undefined>> = process.env
): PrismaClient {
  const config = readDatabaseConfig(env);
  return new PrismaClient({ datasourceUrl: config.url });
}
