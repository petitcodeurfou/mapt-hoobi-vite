import { neon } from '@neondatabase/serverless';

export default async (req: Request) => {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const body = await req.json();
        const { encryptedData, iv } = body;

        if (!encryptedData || !iv) {
            return new Response('Missing data', { status: 400 });
        }

        if (!process.env.DATABASE_URL) {
            console.error('Missing DATABASE_URL environment variable');
            return new Response(JSON.stringify({ error: 'Server Configuration Error: Missing Database URL' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const sql = neon(process.env.DATABASE_URL);

        // Create table if not exists
        await sql`
            CREATE TABLE IF NOT EXISTS ghost_messages (
                id TEXT PRIMARY KEY,
                encrypted_data TEXT NOT NULL,
                iv TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL
            )
        `;

        // Generate ID (simple random string)
        const id = Math.random().toString(36).substring(2, 15);
        
        // Expires in 3 minutes
        const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

        await sql`
            INSERT INTO ghost_messages (id, encrypted_data, iv, expires_at)
            VALUES (${id}, ${encryptedData}, ${iv}, ${expiresAt.toISOString()})
        `;

        return new Response(JSON.stringify({ success: true, id }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Ghost Create Error:', error);
        return new Response(JSON.stringify({ 
            error: error.message,
            stack: error.stack,
            envCheck: !!process.env.DATABASE_URL 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
