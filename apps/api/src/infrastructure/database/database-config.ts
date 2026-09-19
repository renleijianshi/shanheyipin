export interface DatabaseConfig {
  readonly url: string;
}

export function readDatabaseConfig(
  env: Readonly<Record<string, string | undefined>>
): DatabaseConfig {
  const url = env.DATABASE_URL;

  if (!url) {
    throw new Error('DATABASE_URL is required');
  }

  let protocol: string;
  try {
    protocol = new URL(url).protocol;
  } catch {
    throw new Error('DATABASE_URL must be a valid URL');
  }

  if (protocol !== 'mysql:') {
    throw new Error('DATABASE_URL must use mysql://');
  }

  return { url };
}
