import { neon } from '@neondatabase/serverless';

export default async (req: Request) => {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const body = await req.json();
        const { fromUserId, fromEmail, toEmail, subject, content } = body;

        if (!fromUserId || !toEmail || !subject || !content) {
            return new Response('Missing data', { status: 400 });
        }

        const connectionString = "postgresql://neondb_owner:npg_ejvH7QTzxYA9@ep-autumn-mode-af4q8mas-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";
        const sql = neon(connectionString);

        // Create table if not exists
        await sql`
            CREATE TABLE IF NOT EXISTS messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                from_user_id TEXT NOT NULL,
                from_email TEXT NOT NULL,
                to_email TEXT NOT NULL,
                subject TEXT NOT NULL,
                content TEXT NOT NULL,
                read BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Insert message
        const result = await sql`
            INSERT INTO messages (from_user_id, from_email, to_email, subject, content)
            VALUES (${fromUserId}, ${fromEmail}, ${toEmail}, ${subject}, ${content})
            RETURNING id
        `;

        return new Response(JSON.stringify({ success: true, id: result[0].id }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Messages Send Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
