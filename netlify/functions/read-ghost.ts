import { neon } from '@neondatabase/serverless';

export default async (req: Request) => {
    if (req.method !== 'GET') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
        return new Response('Missing ID', { status: 400 });
    }

    try {
        // HARDCODED FALLBACK (LAST RESORT FOR DEBUGGING)
        const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_ejvH9Q1lXfka@ep-little-heart-a8001908-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require";

        const sql = neon(connectionString);

        // Select data and check expiration
        const result = await sql`
            SELECT encrypted_data, iv, expires_at
            FROM ghost_messages
            WHERE id = ${id}
        `;

        if (result.length === 0) {
            return new Response(JSON.stringify({ error: 'Message not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const message = result[0];
        const now = new Date();
        const expiresAt = new Date(message.expires_at);

        if (now > expiresAt) {
            // Expired: Delete and return 410
            await sql`DELETE FROM ghost_messages WHERE id = ${id}`;
            return new Response(JSON.stringify({ error: 'Message expired' }), {
                status: 410,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Valid: Return encrypted data
        return new Response(JSON.stringify({
            encryptedData: message.encrypted_data,
            iv: message.iv,
            expiresAt: message.expires_at
        }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Ghost Read Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
