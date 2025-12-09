import { neon } from '@neondatabase/serverless';

export default async (req: Request) => {
    try {
        // HARDCODED STRING - EXACTLY AS IN create-ghost.ts
        const connectionString = "postgresql://neondb_owner:npg_ejvH9Q1lXfka@ep-little-heart-a8001908-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require";

        const sql = neon(connectionString);

        const start = Date.now();
        const result = await sql`SELECT 1 as result`;
        const duration = Date.now() - start;

        return new Response(JSON.stringify({
            success: true,
            message: "Connection successful",
            duration: `${duration}ms`,
            result: result,
            usedStringStart: connectionString.substring(0, 20) + "..." // Prove we used the right string
        }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message,
            code: error.code,
            detail: error.detail,
            stack: error.stack
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
