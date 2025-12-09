import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function verify() {
    console.log("Testing database connection...");
    if (!process.env.DATABASE_URL) {
        console.error("No DATABASE_URL found in .env");
        process.exit(1);
    }

    try {
        const sql = neon(process.env.DATABASE_URL);
        const result = await sql`SELECT 1 as result`;
        console.log("Connection SUCCESS! Result:", result);
    } catch (err) {
        console.error("Connection FAILED:", err);
    }
}

verify();
