import { useState, useEffect } from 'react';

// --- Crypto Utilities ---

async function generateKey(): Promise<CryptoKey> {
    return window.crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

async function exportKey(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey("jwk", key);
    // Encode key as base64url for URL safety
    return btoa(JSON.stringify(exported)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function importKey(base64Key: string): Promise<CryptoKey> {
    // Decode base64url
    const base64 = base64Key.replace(/-/g, '+').replace(/_/g, '/');
    const jwk = JSON.parse(atob(base64));
    return window.crypto.subtle.importKey(
        "jwk",
        jwk,
        { name: "AES-GCM" },
        true,
        ["encrypt", "decrypt"]
    );
}

async function encryptMessage(message: string, key: CryptoKey): Promise<{ encrypted: string, iv: string }> {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(message);
    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoded
    );

    return {
        encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
        iv: btoa(String.fromCharCode(...iv))
    };
}

async function decryptMessage(encryptedBase64: string, ivBase64: string, key: CryptoKey): Promise<string> {
    const encrypted = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));

    const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        encrypted
    );

    return new TextDecoder().decode(decrypted);
}

// --- Component ---

export function GhostTerminal() {
    const [mode, setMode] = useState<'WRITE' | 'READ' | 'LOADING' | 'ERROR'>('WRITE');
    const [input, setInput] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');
    const [decryptedMessage, setDecryptedMessage] = useState('');
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [error, setError] = useState('');

    // Check URL for ID and Key on mount
    useEffect(() => {
        const hash = window.location.hash;
        if (hash.includes('ghost?')) {
            const params = new URLSearchParams(hash.split('?')[1]);
            const id = params.get('id');
            const keyStr = params.get('key');

            if (id && keyStr) {
                setMode('LOADING');
                handleRead(id, keyStr);
            }
        }
    }, []);

    // Timer countdown
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;
        const timer = setInterval(() => setTimeLeft(t => (t ? t - 1 : 0)), 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        setMode('LOADING');

        try {
            // 1. Generate Key
            const key = await generateKey();
            const keyString = await exportKey(key);

            // 2. Encrypt
            const { encrypted, iv } = await encryptMessage(input, key);

            // 3. Upload (Zero Knowledge: Server doesn't get the key)
            const res = await fetch('/.netlify/functions/create-ghost', {
                method: 'POST',
                body: JSON.stringify({ encryptedData: encrypted, iv }),
            });

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("Server Response (Not JSON):", text);
                // Show the raw response in the UI (truncated) to help debugging
                const rawPreview = text.slice(0, 200);
                throw new Error(`Server Error (${res.status}): ${rawPreview}`);
            }

            if (!data.success) throw new Error(data.error);

            // 4. Generate Link
            const link = `${window.location.origin}/#/ghost?id=${data.id}&key=${keyString}`;
            setGeneratedLink(link);
            setMode('WRITE'); // Stay on write but show link overlay
        } catch (err: any) {
            setError(err.message);
            setMode('ERROR');
        }
    };

    const handleRead = async (id: string, keyStr: string) => {
        try {
            // 1. Fetch Encrypted Blob
            const res = await fetch(`/.netlify/functions/read-ghost?id=${id}`);
            if (res.status === 410) throw new Error("MESSAGE EXPIRED OR DELETED");
            if (res.status === 404) throw new Error("MESSAGE NOT FOUND");

            const responseText = await res.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error("Server Response (Not JSON):", responseText);
                // Show the raw response in the UI (truncated) to help debugging
                const rawPreview = responseText.slice(0, 200);
                throw new Error(`Server Error (${res.status}): ${rawPreview}`);
            }

            // 2. Decrypt Locally
            const key = await importKey(keyStr);
            const text = await decryptMessage(data.encryptedData, data.iv, key);

            setDecryptedMessage(text);

            // Calculate remaining time
            const expiresAt = new Date(data.expiresAt).getTime();
            const now = Date.now();
            setTimeLeft(Math.max(0, Math.floor((expiresAt - now) / 1000)));

            setMode('READ');

            // Clear URL hash to prevent reload loops
            window.history.replaceState(null, '', window.location.pathname);

        } catch (err: any) {
            setError(err.message);
            setMode('ERROR');
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(generatedLink);
        alert("Lien copié ! (Valide 3 minutes)");
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-6 min-h-[500px] flex flex-col items-center justify-center relative">

            {/* Background Effects */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            </div>

            <div className="relative z-10 w-full p-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h2 className="font-display text-2xl tracking-widest text-white flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        GHOST PROTOCOL
                    </h2>
                    <div className="text-xs font-mono text-white/40">AES-256-GCM // ZERO KNOWLEDGE</div>
                </div>

                {/* WRITE MODE */}
                {mode === 'WRITE' && !generatedLink && (
                    <form onSubmit={handleCreate} className="flex flex-col gap-6">
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Entrez votre message confidentiel..."
                            className="w-full h-40 bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:outline-none focus:border-red-500/50 transition-colors font-mono resize-none"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className="w-full py-4 bg-white text-black font-bold tracking-widest rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            CHIFFRER & GÉNÉRER LE LIEN
                        </button>
                    </form>
                )}

                {/* LINK GENERATED */}
                {generatedLink && (
                    <div className="flex flex-col gap-6 animate-fade-in">
                        <div className="bg-green-500/10 border border-green-500/30 p-6 rounded-xl text-center">
                            <p className="text-green-400 font-mono text-sm mb-2">MESSAGE SÉCURISÉ</p>
                            <p className="text-white/60 text-xs mb-4">Ce lien expirera dans 3 minutes.</p>
                            <div className="bg-black/50 p-3 rounded-lg break-all text-xs font-mono text-white/80 mb-4 select-all">
                                {generatedLink}
                            </div>
                            <button
                                onClick={copyLink}
                                className="px-6 py-2 bg-green-500 text-black font-bold rounded-lg hover:bg-green-400 transition-colors"
                            >
                                COPIER LE LIEN
                            </button>
                        </div>
                        <button
                            onClick={() => { setGeneratedLink(''); setInput(''); }}
                            className="text-white/40 text-xs hover:text-white transition-colors"
                        >
                            Nouveau Message
                        </button>
                    </div>
                )}

                {/* READ MODE */}
                {mode === 'READ' && (
                    <div className="flex flex-col gap-6 animate-fade-in">
                        <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-shrink" style={{ animationDuration: `${timeLeft}s` }} />

                            <div className="flex justify-between items-center mb-4">
                                <p className="text-red-400 font-mono text-sm">TOP SECRET</p>
                                <p className="text-red-400 font-mono text-sm animate-pulse">
                                    {Math.floor(timeLeft! / 60)}:{(timeLeft! % 60).toString().padStart(2, '0')}
                                </p>
                            </div>

                            <p className="text-white font-mono text-lg leading-relaxed whitespace-pre-wrap">
                                {decryptedMessage}
                            </p>
                        </div>
                        <p className="text-center text-white/30 text-xs">
                            Ce message s'autodétruira à la fin du compte à rebours.
                        </p>
                    </div>
                )}

                {/* ERROR / LOADING */}
                {(mode === 'ERROR' || mode === 'LOADING') && (
                    <div className="text-center py-12">
                        {mode === 'LOADING' && (
                            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
                        )}
                        {mode === 'ERROR' && (
                            <div className="text-red-500 font-mono">
                                <p className="text-2xl mb-2">⚠️</p>
                                {error}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
