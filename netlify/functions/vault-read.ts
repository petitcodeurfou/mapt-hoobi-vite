import { neon } from '@neondatabase/serverless';

export default async (req: Request) => {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
        return new Response('Missing ID', { status: 400 });
    }

    try {
        const connectionString = "postgresql://neondb_owner:npg_ejvH7QTzxYA9@ep-autumn-mode-af4q8mas-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";
        const sql = neon(connectionString);

        const result = await sql`
            SELECT content, auth_hash, updated_at 
            FROM vault_notes 
            WHERE id = ${id}
        `;

        if (result.length === 0) {
            return new Response('Note not found', { status: 404 });
        }

        return new Response(JSON.stringify(result[0]), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Vault Read Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
