import { neon } from '@neondatabase/serverless';

export default async (req: Request) => {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const body = await req.json();
        const { id, encryptedContent, authHash } = body;

        if (!id || !encryptedContent || !authHash) {
            return new Response('Missing data', { status: 400 });
        }

        const connectionString = "postgresql://neondb_owner:npg_ejvH7QTzxYA9@ep-autumn-mode-af4q8mas-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";
        const sql = neon(connectionString);

        // 1. Verify Auth Hash matches what is in DB
        const current = await sql`
            SELECT auth_hash FROM vault_notes WHERE id = ${id}
        `;

        if (current.length === 0) {
            return new Response('Note not found', { status: 404 });
        }

        if (current[0].auth_hash !== authHash) {
            return new Response('Unauthorized: Invalid Password', { status: 401 });
        }

        // 2. Update Content
        await sql`
            UPDATE vault_notes 
            SET content = ${encryptedContent}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${id}
        `;

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Vault Update Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
