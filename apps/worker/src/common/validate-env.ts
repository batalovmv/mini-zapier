/**
 * Fail-fast validation of required environment variables for apps/worker.
 * Must be called BEFORE NestFactory.createApplicationContext() so the
 * process exits immediately with a clear error message.
 */
export function validateWorkerEnv(): void {
  const required: string[] = [
    'DATABASE_URL',
    'APP_ENCRYPTION_KEY',
  ];

  const missing = required.filter(
    (key) => !process.env[key] || process.env[key]!.trim().length === 0,
  );

  if (missing.length > 0) {
    console.error(
      `[FATAL] Missing required environment variables: ${missing.join(', ')}`,
    );
    console.error('The worker cannot start without these variables. Exiting.');
    process.exit(1);
  }
}
