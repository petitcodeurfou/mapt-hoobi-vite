import { neon } from '@neondatabase/serverless';

export default async (req: Request) => {
    const url = new URL(req.url);
    const userEmail = url.searchParams.get('email');

    if (!userEmail) {
        return new Response('Missing email', { status: 400 });
    }

    try {
        const connectionString = "postgresql://neondb_owner:npg_ejvH7QTzxYA9@ep-autumn-mode-af4q8mas-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";
        const sql = neon(connectionString);

        // Get messages where to_email matches
        const messages = await sql`
            SELECT id, from_email, subject, content, read, created_at 
            FROM messages 
            WHERE to_email = ${userEmail}
            ORDER BY created_at DESC
            LIMIT 50
        `;

        return new Response(JSON.stringify(messages), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Messages Inbox Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
