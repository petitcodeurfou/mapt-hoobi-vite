import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Crypto Utilities (Unchanged) ---
async function generateKey(): Promise<CryptoKey> {
    return window.crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

async function exportKey(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey("jwk", key);
    return btoa(JSON.stringify(exported)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function importKey(base64Key: string): Promise<CryptoKey> {
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

// --- Scramble Text Component ---
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";

function ScrambleText({ text, className = "", delay = 0, speed = 30, infinite = false }: { text: string, className?: string, delay?: number, speed?: number, infinite?: boolean }) {
    const [display, setDisplay] = useState(text);
    const iterations = useRef(0);

    useEffect(() => {
        let interval: any;

        const startScramble = () => {
            interval = setInterval(() => {
                setDisplay(
                    text
                        .split("")
                        .map((_, index) => {
                            if (!infinite && index < iterations.current) {
                                return text[index];
                            }
                            return CHARS[Math.floor(Math.random() * CHARS.length)];
                        })
                        .join("")
                );

                if (!infinite && iterations.current >= text.length) {
                    clearInterval(interval);
                }

                iterations.current += 1 / 3; // Speed of reveal
            }, speed);
        };

        const timeout = setTimeout(startScramble, delay);

        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, [text, delay, speed, infinite]);

    return <span className={className}>{display}</span>;
}

// --- Main Component ---

export function GhostTerminal() {
    const [mode, setMode] = useState<'WRITE' | 'READ' | 'ENCRYPTING' | 'LOADING' | 'ERROR'>('WRITE');
    const [input, setInput] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');
    const [decryptedMessage, setDecryptedMessage] = useState('');
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [encryptionColor, setEncryptionColor] = useState('text-[#1a1a1a]'); // Default black

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

    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;
        const timer = setInterval(() => setTimeLeft(t => (t ? t - 1 : 0)), 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        // Start Encryption Animation
        setMode('ENCRYPTING');
        setEncryptionColor('text-[#1a1a1a]'); // Reset color

        // Artificial delay to show the animation
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            const key = await generateKey();
            const keyString = await exportKey(key);
            const { encrypted, iv } = await encryptMessage(input, key);

            const res = await fetch('/.netlify/functions/create-ghost', {
                method: 'POST',
                body: JSON.stringify({ encryptedData: encrypted, iv }),
            });

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error(`Server Error (${res.status}): ${text.slice(0, 200)}`);
            }

            if (!data.success) throw new Error(data.error);

            const link = `${window.location.origin}/#/ghost?id=${data.id}&key=${keyString}`;
            setGeneratedLink(link);
            setMode('WRITE'); // Go back to write mode to show the overlay with link
        } catch (err: any) {
            // Error Animation
            setEncryptionColor('text-red-600'); // Turn text red
            await new Promise(resolve => setTimeout(resolve, 5000)); // Show red text for 5 seconds

            setError(err.message);
            setMode('ERROR');
        }
    };

    const handleRead = async (id: string, keyStr: string) => {
        try {
            const res = await fetch(`/.netlify/functions/read-ghost?id=${id}`);
            if (res.status === 410) throw new Error("This message has vanished.");
            if (res.status === 404) throw new Error("Message not found.");

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error(`Server Error (${res.status}): ${text.slice(0, 200)}`);
            }

            const key = await importKey(keyStr);
            const decrypted = await decryptMessage(data.encryptedData, data.iv, key);

            setDecryptedMessage(decrypted);
            const expiresAt = new Date(data.expiresAt).getTime();
            setTimeLeft(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));
            setMode('READ');
            window.history.replaceState(null, '', window.location.pathname);
        } catch (err: any) {
            setError(err.message);
            setMode('ERROR');
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(generatedLink);
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#1a1a1a] font-sans selection:bg-[#1a1a1a] selection:text-white overflow-hidden relative">

            {/* --- Ambient Background --- */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-orange-100/50 blur-[100px] rounded-full mix-blend-multiply" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-100/50 blur-[80px] rounded-full mix-blend-multiply" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 brightness-100 contrast-150" />
            </div>

            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">

                {/* --- Header --- */}
                <header className="mb-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-white border border-[#1a1a1a]/5 shadow-xl shadow-[#1a1a1a]/5">
                        <span className="text-3xl">👻</span>
                    </div>
                    <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight mb-3 text-[#1a1a1a]">
                        Ghost Protocol
                    </h1>
                    <p className="text-[#1a1a1a]/40 text-sm tracking-widest uppercase font-medium">
                        Secure. Anonymous. Ephemeral.
                    </p>
                </header>

                {/* --- Main Card --- */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-lg bg-white rounded-3xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] border border-[#1a1a1a]/5 overflow-hidden"
                >
                    {/* Progress Bar */}
                    {(mode === 'LOADING' || mode === 'ENCRYPTING') && (
                        <div className="h-1 w-full bg-[#1a1a1a]/5">
                            <motion.div
                                className="h-full bg-[#1a1a1a]"
                                initial={{ width: "0%" }}
                                animate={{ width: mode === 'ENCRYPTING' ? "100%" : "0%" }}
                                transition={{ duration: 2, ease: "easeInOut" }}
                            />
                        </div>
                    )}

                    <div className="p-8 md:p-10 min-h-[400px] flex flex-col relative">

                        <AnimatePresence mode="wait">
                            {/* WRITE MODE */}
                            {mode === 'WRITE' && !generatedLink && (
                                <motion.div
                                    key="write"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex-1 flex flex-col"
                                >
                                    <div className="flex-1 mb-8">
                                        <textarea
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder="Type your secure message here..."
                                            className="w-full h-full bg-transparent text-[#1a1a1a] placeholder-[#1a1a1a]/20 resize-none focus:outline-none text-xl font-serif leading-relaxed"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="flex justify-between items-center pt-8 border-t border-[#1a1a1a]/5">
                                        <div className="flex gap-4 text-xs text-[#1a1a1a]/40 font-medium tracking-wide uppercase">
                                            <span className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                                                AES-256
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                                                Zero-Knowledge
                                            </span>
                                        </div>
                                        <button
                                            onClick={handleCreate}
                                            disabled={!input.trim()}
                                            className="px-6 py-2.5 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#1a1a1a]/10"
                                        >
                                            Create Link
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* ENCRYPTING ANIMATION MODE */}
                            {mode === 'ENCRYPTING' && (
                                <motion.div
                                    key="encrypting"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.1 }}
                                    className="flex-1 flex flex-col items-center justify-center text-center absolute inset-0 bg-white z-10"
                                >
                                    <div className={`w-full text-center text-4xl md:text-5xl font-serif font-bold break-all px-8 ${encryptionColor} transition-colors duration-300`}>
                                        <ScrambleText
                                            text={input.slice(0, 20) + (input.length > 20 ? "..." : "")}
                                            speed={50}
                                            infinite={true}
                                        />
                                    </div>
                                    <p className="mt-8 text-xs uppercase tracking-[0.3em] text-[#1a1a1a]/40 animate-pulse">
                                        Encrypting Data
                                    </p>
                                </motion.div>
                            )}

                            {/* READ MODE */}
                            {mode === 'READ' && (
                                <motion.div
                                    key="read"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex-1 flex flex-col items-center justify-center text-center"
                                >
                                    <div className="w-16 h-16 bg-[#1a1a1a]/5 rounded-full flex items-center justify-center mb-6">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#1a1a1a]">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                        </svg>
                                    </div>

                                    <h3 className="text-xl font-serif font-medium text-[#1a1a1a] mb-2">Secure Message</h3>
                                    <p className="text-[#1a1a1a]/50 text-sm mb-8 max-w-xs">
                                        This message is encrypted and will vanish forever after reading.
                                    </p>

                                    {!decryptedMessage ? (
                                        <button
                                            onClick={() => {
                                                const params = new URLSearchParams(window.location.hash.split('?')[1]);
                                                const id = params.get('id');
                                                const key = params.get('key');
                                                if (id && key) handleRead(id, key);
                                            }}
                                            className="w-full py-3 bg-[#1a1a1a] text-white font-medium rounded-xl hover:bg-black transition-all shadow-lg shadow-[#1a1a1a]/10"
                                        >
                                            Reveal Message
                                        </button>
                                    ) : (
                                        <div className="w-full text-left bg-[#1a1a1a]/5 p-6 rounded-xl border border-[#1a1a1a]/5">
                                            <p className="text-[#1a1a1a] whitespace-pre-wrap font-serif text-lg leading-relaxed">
                                                {decryptedMessage}
                                            </p>

                                            <div className="mt-6 pt-4 border-t border-[#1a1a1a]/5 flex justify-between items-center">
                                                <span className="text-xs text-red-500 flex items-center gap-1.5 font-medium">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                                    Burned
                                                </span>
                                                <button
                                                    onClick={() => window.location.href = '/'}
                                                    className="text-xs text-[#1a1a1a]/40 hover:text-[#1a1a1a] transition-colors"
                                                >
                                                    Close
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* LOADING / SUCCESS OVERLAYS */}
                            {(mode === 'LOADING' || mode === 'ERROR' || generatedLink) && (
                                <motion.div
                                    key="overlay"
                                    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                                    animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                                    exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                                    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80"
                                >
                                    {mode === 'LOADING' && (
                                        <div className="flex flex-col items-center">
                                            <div className="w-10 h-10 border-2 border-[#1a1a1a]/10 border-t-[#1a1a1a] rounded-full animate-spin mb-4" />
                                            <p className="text-[#1a1a1a]/40 text-xs tracking-widest uppercase font-medium">Processing</p>
                                        </div>
                                    )}

                                    {generatedLink && (
                                        <div className="w-full px-8 text-center">
                                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-green-100">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                                                </svg>
                                            </div>
                                            <h3 className="text-xl font-serif font-medium text-[#1a1a1a] mb-2">Link Ready</h3>

                                            <div className="bg-[#1a1a1a]/5 p-3 rounded-lg border border-[#1a1a1a]/5 mb-6 flex items-center gap-3">
                                                <code className="text-xs text-[#1a1a1a]/60 truncate flex-1 font-mono">
                                                    {generatedLink}
                                                </code>
                                                <button
                                                    onClick={copyLink}
                                                    className="p-2 hover:bg-white rounded-md transition-colors text-[#1a1a1a]/60 hover:text-[#1a1a1a] shadow-sm"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                        <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                                                        <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                                                    </svg>
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    setGeneratedLink('');
                                                    setInput('');
                                                    setMode('WRITE');
                                                }}
                                                className="text-sm text-[#1a1a1a]/40 hover:text-[#1a1a1a] transition-colors"
                                            >
                                                Create Another
                                            </button>
                                        </div>
                                    )}

                                    {mode === 'ERROR' && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-center max-w-sm p-8"
                                        >
                                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 ring-1 ring-red-100">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-500">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-xl font-bold text-red-900 mb-2">Connection Error</h3>
                                            <p className="text-red-700/80 text-sm mb-6 bg-red-50 p-3 rounded-lg border border-red-100">
                                                {error || "An unexpected error occurred."}
                                            </p>
                                            <button
                                                onClick={() => setMode('WRITE')}
                                                className="px-6 py-2 bg-[#1a1a1a] text-white text-sm font-medium rounded-lg hover:bg-black transition-colors shadow-lg shadow-red-500/10"
                                            >
                                                Try Again
                                            </button>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Footer */}
                <footer className="mt-12 text-center">
                    <p className="text-[#1a1a1a]/20 text-xs font-medium">
                        ENCRYPTED • ANONYMOUS • EPHEMERAL
                    </p>
                </footer>
            </div>
        </div>
    );
}
