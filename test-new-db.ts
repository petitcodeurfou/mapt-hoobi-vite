import { neon } from '@neondatabase/serverless';

async function testNewCredentials() {
    console.log("Testing NEW credentials from user...");

    const connectionString = "postgresql://neondb_owner:npg_ejvH7QTzxYA9@ep-autumn-mode-af4q8mas-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";

    try {
        const sql = neon(connectionString);
        const result = await sql`SELECT 1 as test`;
        console.log("✅ SUCCESS! Connection works:", result);
    } catch (err: any) {
        console.error("❌ FAIL:", err.message);
    }
}

testNewCredentials();
