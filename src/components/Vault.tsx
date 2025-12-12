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
            setStatus('Saving...');
            try {
                const encrypted = await encryptData(content, key);
                const authHash = await hashPassword(password); // Re-hash for verification

                const res = await fetch('/.netlify/functions/vault-update', {
                    method: 'POST',
                    body: JSON.stringify({ id: noteId, encryptedContent: encrypted, authHash }),
                });

                if (!res.ok) throw new Error('Save failed');
                setStatus('Saved');
                setTimeout(() => setStatus(''), 2000);
            } catch (e) {
                setStatus('Error saving');
            }
        };

        const timeout = setTimeout(save, 1000); // Debounce 1s
        return () => clearTimeout(timeout);
    }, [content, noteId, key, mode]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMode('LOADING');
        try {
            const derivedKey = await deriveKey(password);
            const encrypted = await encryptData("", derivedKey); // Empty init
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

            // Update URL without reload
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

            // Verify hash locally (optional, but good for UX before decrypt fail)
            if (data.auth_hash !== authHash) {
                throw new Error('Incorrect Password');
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

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-200 font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">

            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-2xl">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-cyan-900/20 rounded-xl flex items-center justify-center border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-cyan-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">VAULT</h1>
                        <p className="text-xs text-cyan-500/60 uppercase tracking-widest font-medium">Secure Encrypted Storage</p>
                    </div>
                </div>

                <AnimatePresence mode="wait">

                    {/* SETUP MODE */}
                    {mode === 'SETUP' && (
                        <motion.form
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            onSubmit={handleCreate}
                            className="bg-[#111] p-8 rounded-2xl border border-white/5 shadow-2xl"
                        >
                            <h2 className="text-xl font-medium text-white mb-2">Create New Vault</h2>
                            <p className="text-gray-500 text-sm mb-6">Set a strong password. This password is the ONLY way to decrypt your data. If you lose it, your data is lost forever.</p>

                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Set Master Password"
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all mb-4"
                                autoFocus
                            />

                            <button
                                type="submit"
                                disabled={!password}
                                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Initialize Vault
                            </button>
                        </motion.form>
                    )}

                    {/* LOCKED MODE */}
                    {mode === 'LOCKED' && (
                        <motion.form
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            onSubmit={handleUnlock}
                            className="bg-[#111] p-8 rounded-2xl border border-white/5 shadow-2xl text-center"
                        >
                            <div className="w-16 h-16 bg-red-900/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-red-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </div>

                            <h2 className="text-xl font-medium text-white mb-2">Vault Locked</h2>
                            <p className="text-gray-500 text-sm mb-6">Enter your master password to decrypt this note.</p>

                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter Password"
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all mb-4"
                                autoFocus
                            />

                            <button
                                type="submit"
                                disabled={!password}
                                className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-lg transition-colors"
                            >
                                Decrypt & Open
                            </button>
                        </motion.form>
                    )}

                    {/* EDITOR MODE */}
                    {mode === 'EDITOR' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#111] rounded-2xl border border-white/5 shadow-2xl overflow-hidden h-[600px] flex flex-col"
                        >
                            <div className="bg-[#1a1a1a] px-4 py-2 border-b border-white/5 flex justify-between items-center">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                                </div>
                                <span className="text-xs font-mono text-gray-500">
                                    {status || 'Ready'}
                                </span>
                            </div>

                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="flex-1 bg-transparent p-6 text-gray-300 font-mono text-sm resize-none focus:outline-none leading-relaxed"
                                placeholder="Start typing... content is encrypted automatically."
                                spellCheck={false}
                            />

                            <div className="bg-[#1a1a1a] px-4 py-2 border-t border-white/5 text-xs text-gray-600 flex justify-between">
                                <span>AES-256-GCM Encrypted</span>
                                <span className="font-mono truncate max-w-[200px] opacity-50">ID: {noteId}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
