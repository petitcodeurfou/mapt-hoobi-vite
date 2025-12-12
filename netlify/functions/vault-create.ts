import { neon } from '@neondatabase/serverless';

export default async (req: Request) => {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const body = await req.json();
        const { encryptedContent, authHash } = body;

        if (!encryptedContent || !authHash) {
            return new Response('Missing data', { status: 400 });
        }

        const connectionString = "postgresql://neondb_owner:npg_ejvH7QTzxYA9@ep-autumn-mode-af4q8mas-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";
        const sql = neon(connectionString);

        // Create table if not exists
        await sql`
            CREATE TABLE IF NOT EXISTS vault_notes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                content TEXT NOT NULL,
                auth_hash TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Insert new note
        const result = await sql`
            INSERT INTO vault_notes (content, auth_hash)
            VALUES (${encryptedContent}, ${authHash})
            RETURNING id
        `;

        const id = result[0].id;

        return new Response(JSON.stringify({ success: true, id }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Vault Create Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
