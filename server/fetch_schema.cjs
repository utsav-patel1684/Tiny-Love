const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_gpN0QcFWOf8u@ep-cool-unit-aqqnyxc1.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function run() {
  await client.connect();
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
  console.log("TABLES:", res.rows.map(r => r.table_name));

  for (const row of res.rows) {
    const table = row.table_name;
    const cols = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='${table}'`);
    console.log(`\nTable ${table}:`);
    for (const col of cols.rows) {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    }
  }
  
  await client.end();
}

run().catch(console.error);
