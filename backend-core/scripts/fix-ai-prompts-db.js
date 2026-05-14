const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'zaplandia',
  password: 'zaplandia_secret',
  database: 'zaplandia_db',
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database.');

    await client.query('ALTER TABLE ai_prompts ADD COLUMN IF NOT EXISTS provider VARCHAR;');
    await client.query('ALTER TABLE ai_prompts ADD COLUMN IF NOT EXISTS model VARCHAR;');
    await client.query('ALTER TABLE ai_prompts ADD COLUMN IF NOT EXISTS "apiKey" VARCHAR;');

    console.log('Columns added successfully.');
  } catch (err) {
    console.error('Error adding columns:', err);
  } finally {
    await client.end();
  }
}

run();
