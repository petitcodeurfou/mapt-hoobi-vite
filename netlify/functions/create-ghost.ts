```typescript
import { neon } from '@neondatabase/serverless';

export default async (req: Request) => {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const body = await req.json();
        const { encryptedData, iv } = body;
    // ... rest of the code ...
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
```
