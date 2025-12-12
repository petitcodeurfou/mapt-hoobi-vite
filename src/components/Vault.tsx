import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Crypto Utilities ---

async function deriveKey(password: string, salt: string = 'vault_salt_static'): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: enc.encode(salt),
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

async function hashPassword(password: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function encryptData(text: string, key: CryptoKey): Promise<string> {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(text);
    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoded
    );

    const encryptedArray = new Uint8Array(encrypted);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv);
    combined.set(encryptedArray, iv.length);

    return btoa(String.fromCharCode(...combined));
}

async function decryptData(encryptedBase64: string, key: CryptoKey): Promise<string> {
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        data
    );

    return new TextDecoder().decode(decrypted);
}

// --- Component ---

export function Vault() {
    const [mode, setMode] = useState<'SETUP' | 'LOCKED' | 'EDITOR' | 'LOADING'>('LOADING');
    const [noteId, setNoteId] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [content, setContent] = useState('');
    const [status, setStatus] = useState('');
    const [key, setKey] = useState<CryptoKey | null>(null);
    const [copied, setCopied] = useState(false);

    // Check URL for ID on load
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (id) {
            setNoteId(id);
            setMode('LOCKED');
        } else {
            setMode('SETUP');
        }
    }, []);

    // Auto-save logic
    useEffect(() => {
        if (mode !== 'EDITOR' || !noteId || !key) return;

        const save = async () => {
            setStatus('Chiffrement...');
            try {
                const encrypted = await encryptData(content, key);
                const authHash = await hashPassword(password);

                const res = await fetch('/.netlify/functions/vault-update', {
                    method: 'POST',
                    body: JSON.stringify({ id: noteId, encryptedContent: encrypted, authHash }),
                });

                if (!res.ok) throw new Error('Save failed');
                setStatus('Sauvegardé ✓');
                setTimeout(() => setStatus(''), 2000);
            } catch (e) {
                setStatus('Erreur de sauvegarde');
            }
        };

        const timeout = setTimeout(save, 1000);
        return () => clearTimeout(timeout);
    }, [content, noteId, key, mode, password]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMode('LOADING');
        try {
            const derivedKey = await deriveKey(password);
            const encrypted = await encryptData("", derivedKey);
            const authHash = await hashPassword(password);

            const res = await fetch('/.netlify/functions/vault-create', {
                method: 'POST',
                body: JSON.stringify({ encryptedContent: encrypted, authHash }),
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            setNoteId(data.id);
            setKey(derivedKey);
            setMode('EDITOR');

            const newUrl = `${window.location.pathname}?id=${data.id}`;
            window.history.pushState({ path: newUrl }, '', newUrl);

        } catch (err: any) {
            alert(err.message);
            setMode('SETUP');
        }
    };

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setMode('LOADING');
        try {
            const derivedKey = await deriveKey(password);
            const authHash = await hashPassword(password);

            const res = await fetch(`/.netlify/functions/vault-read?id=${noteId}`);
            if (!res.ok) throw new Error('Note not found');

            const data = await res.json();

            if (data.auth_hash !== authHash) {
                throw new Error('Mot de passe incorrect');
            }

            const decrypted = await decryptData(data.content, derivedKey);
            setContent(decrypted);
            setKey(derivedKey);
            setMode('EDITOR');

        } catch (err: any) {
            alert(err.message);
            setMode('LOCKED');
            setPassword('');
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans relative overflow-hidden">

            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/10 blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            </div>

            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">

                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 text-center"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 shadow-2xl shadow-cyan-500/10 backdrop-blur-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-cyan-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                    </div>
                    <h1 className="text-5xl font-bold tracking-tight mb-3 bg-gradient-to-r from-white via-cyan-200 to-white bg-clip-text text-transparent">
                        VAULT
                    </h1>
                    <p className="text-white/30 text-sm tracking-[0.3em] uppercase font-medium">
                        Secure • Encrypted • Private
                    </p>
                </motion.header>

                <AnimatePresence mode="wait">

                    {/* LOADING */}
                    {mode === 'LOADING' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center"
                        >
                            <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                            <p className="mt-4 text-white/40 text-sm">Chargement...</p>
                        </motion.div>
                    )}

                    {/* SETUP MODE */}
                    {mode === 'SETUP' && (
                        <motion.form
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            onSubmit={handleCreate}
                            className="w-full max-w-md bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl"
                        >
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
                                    <span className="text-3xl">🔐</span>
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Créer un Vault</h2>
                                <p className="text-white/40 text-sm">Vos données seront chiffrées avec votre mot de passe. <span className="text-red-400">Ne le perdez jamais.</span></p>
                            </div>

                            <div className="relative mb-6">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mot de passe maître"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/30 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all text-lg"
                                    autoFocus
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                                    </svg>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={!password || password.length < 4}
                                className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 text-lg"
                            >
                                Initialiser le Vault
                            </button>

                            <p className="text-center text-white/20 text-xs mt-6">
                                Chiffrement AES-256-GCM • Zero-Knowledge
                            </p>
                        </motion.form>
                    )}

                    {/* LOCKED MODE */}
                    {mode === 'LOCKED' && (
                        <motion.form
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            onSubmit={handleUnlock}
                            className="w-full max-w-md bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl"
                        >
                            <div className="text-center mb-8">
                                <motion.div
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-red-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                    </svg>
                                </motion.div>
                                <h2 className="text-2xl font-bold text-white mb-2">Vault Verrouillé</h2>
                                <p className="text-white/40 text-sm">Entrez votre mot de passe pour déchiffrer ce vault.</p>
                            </div>

                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Mot de passe"
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/30 focus:border-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all mb-6 text-lg"
                                autoFocus
                            />

                            <button
                                type="submit"
                                disabled={!password}
                                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl transition-all border border-white/10"
                            >
                                Déverrouiller
                            </button>
                        </motion.form>
                    )}

                    {/* EDITOR MODE */}
                    {mode === 'EDITOR' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-3xl"
                        >
                            {/* Toolbar */}
                            <div className="flex justify-between items-center mb-4 px-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-white/40 text-sm font-medium">
                                        {status || 'Prêt'}
                                    </span>
                                </div>
                                <button
                                    onClick={copyLink}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-sm text-white/60 hover:text-white transition-all"
                                >
                                    {copied ? (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-green-400">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                            </svg>
                                            Copié !
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                                            </svg>
                                            Copier le lien
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Editor Card */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="w-full h-[500px] bg-black/60 p-8 text-white text-lg leading-relaxed resize-none focus:outline-none placeholder-white/50"
                                    placeholder="Commencez à écrire... Tout est chiffré automatiquement."
                                    spellCheck={false}
                                />

                                <div className="bg-black/30 px-6 py-3 border-t border-white/5 flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-white/20 text-xs">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                        </svg>
                                        AES-256-GCM
                                    </div>
                                    <span className="text-white/10 text-xs font-mono truncate max-w-[200px]">
                                        {noteId?.slice(0, 8)}...
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
