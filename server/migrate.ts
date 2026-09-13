import { pool, verifyDatabaseConnection } from "./db";

async function verifySchema() {
  await verifyDatabaseConnection();

  const result = await pool.query<{ table_name: string }>(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'sessions',
        'users',
        'variable_definitions',
        'variable_values',
        'api_keys',
        'webhooks'
      )
    ORDER BY table_name
  `);

  const expectedTables = [
    "api_keys",
    "sessions",
    "users",
    "variable_definitions",
    "variable_values",
    "webhooks",
  ];
  const actualTables = result.rows.map((row) => row.table_name);

  if (JSON.stringify(actualTables) !== JSON.stringify(expectedTables)) {
    throw new Error(
      "Managed PostgreSQL schema is incomplete. Run `npm run db:push` before starting the app.",
    );
  }

  console.log("Managed PostgreSQL schema is ready");
}

verifySchema()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });