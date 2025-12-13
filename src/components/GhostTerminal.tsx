import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Crypto Utilities ---
async function generateKey(): Promise<CryptoKey> {
    return window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}

async function exportKey(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey("jwk", key);
    return btoa(JSON.stringify(exported)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function importKey(base64Key: string): Promise<CryptoKey> {
    const base64 = base64Key.replace(/-/g, '+').replace(/_/g, '/');
    return window.crypto.subtle.importKey("jwk", JSON.parse(atob(base64)), { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);
}

async function encryptMessage(message: string, key: CryptoKey): Promise<{ encrypted: string, iv: string }> {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(message));
    return {
        encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
        iv: btoa(String.fromCharCode(...iv))
    };
}

async function decryptMessage(encryptedBase64: string, ivBase64: string, key: CryptoKey): Promise<string> {
    const encrypted = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted);
    return new TextDecoder().decode(decrypted);
}

// ============================================
// ULTRA PREMIUM VISUAL COMPONENTS
// ============================================

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;':\",./<>?アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";

// Dense Matrix Rain
const DenseMatrixRain = ({ columns = 40 }: { columns?: number }) => {
    const streams = useMemo(() =>
        Array.from({ length: columns }).map((_, i) => ({
            id: i,
            x: (i / columns) * 100,
            chars: Array.from({ length: 25 }).map(() => CHARS[Math.floor(Math.random() * CHARS.length)]),
            speed: 8 + Math.random() * 12,
            delay: Math.random() * 5,
            brightness: 0.3 + Math.random() * 0.7,
        })), [columns]
    );

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
            {streams.map(stream => (
                <motion.div
                    key={stream.id}
                    className="absolute text-green-500 font-mono text-xs leading-tight whitespace-pre"
                    style={{
                        left: `${stream.x}%`,
                        opacity: stream.brightness * 0.6,
                        textShadow: '0 0 10px rgba(34, 197, 94, 0.8)',
                    }}
                    initial={{ y: '-100%' }}
                    animate={{ y: '120vh' }}
                    transition={{
                        duration: stream.speed,
                        delay: stream.delay,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                >
                    {stream.chars.map((char, j) => (
                        <div
                            key={j}
                            style={{
                                opacity: 1 - (j * 0.04),
                                color: j === 0 ? '#fff' : undefined,
                            }}
                        >
                            {char}
                        </div>
                    ))}
                </motion.div>
            ))}
        </div>
    );
};

// Glitch effect on text
const GlitchText = ({ children, className = '' }: { children: string; className?: string }) => {
    const [isGlitching, setIsGlitching] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsGlitching(true);
            setTimeout(() => setIsGlitching(false), 150);
        }, 2000 + Math.random() * 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <span className={`relative inline-block ${className}`}>
            <span className="relative z-10">{children}</span>
            {isGlitching && (
                <>
                    <span
                        className="absolute top-0 left-0 text-red-500 z-0"
                        style={{
                            transform: 'translateX(-3px)',
                            clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)',
                        }}
                    >
                        {children}
                    </span>
                    <span
                        className="absolute top-0 left-0 text-cyan-500 z-0"
                        style={{
                            transform: 'translateX(3px)',
                            clipPath: 'polygon(0 55%, 100% 55%, 100% 100%, 0 100%)',
                        }}
                    >
                        {children}
                    </span>
                </>
            )}
        </span>
    );
};

// Scramble text animation
const ScrambleText = ({ text, speed = 30 }: { text: string; speed?: number }) => {
    const [display, setDisplay] = useState(text);
    const iterations = useRef(0);

    useEffect(() => {
        iterations.current = 0;
        const interval = setInterval(() => {
            setDisplay(
                text.split("").map((char, index) => {
                    if (index < iterations.current) return text[index];
                    return CHARS[Math.floor(Math.random() * 60)]; // Use only alphanumeric
                }).join("")
            );
            if (iterations.current >= text.length) clearInterval(interval);
            iterations.current += 0.5;
        }, speed);
        return () => clearInterval(interval);
    }, [text, speed]);

    return <span className="font-mono">{display}</span>;
};

// Terminal typing effect
const TerminalLine = ({ text, delay = 0 }: { text: string; delay?: number }) => {
    const [displayText, setDisplayText] = useState('');
    const [showCursor, setShowCursor] = useState(true);

    useEffect(() => {
        let i = 0;
        const timeout = setTimeout(() => {
            const interval = setInterval(() => {
                if (i < text.length) {
                    setDisplayText(text.slice(0, i + 1));
                    i++;
                } else {
                    clearInterval(interval);
                }
            }, 30);
            return () => clearInterval(interval);
        }, delay);

        const cursorInterval = setInterval(() => setShowCursor(v => !v), 500);
        return () => { clearTimeout(timeout); clearInterval(cursorInterval); };
    }, [text, delay]);

    return (
        <span className="text-green-400">
            {displayText}
            <span className={showCursor ? 'opacity-100' : 'opacity-0'}>▊</span>
        </span>
    );
};

// Floating binary
const FloatingBinary = () => {
    const bits = useMemo(() =>
        Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            value: Math.random() > 0.5 ? '1' : '0',
            duration: 5 + Math.random() * 10,
            delay: Math.random() * 3,
        })), []
    );

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
            {bits.map(bit => (
                <motion.span
                    key={bit.id}
                    className="absolute text-green-500/30 font-mono text-xs"
                    style={{ left: `${bit.x}%`, top: `${bit.y}%` }}
                    animate={{
                        opacity: [0.1, 0.4, 0.1],
                        scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                        duration: bit.duration,
                        delay: bit.delay,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                >
                    {bit.value}
                </motion.span>
            ))}
        </div>
    );
};

// Encryption progress
const EncryptionVisual = () => (
    <div className="flex flex-col items-center gap-6">
        <div className="relative">
            {/* Outer ring */}
            <motion.div
                className="w-32 h-32 rounded-full border-2 border-green-500/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
            {/* Middle ring */}
            <motion.div
                className="absolute inset-4 rounded-full border-2 border-green-500/50"
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
            {/* Inner pulsing */}
            <motion.div
                className="absolute inset-8 rounded-full bg-green-500/20"
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 1, repeat: Infinity }}
            />
            {/* Lock icon */}
            <div className="absolute inset-0 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-green-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
            </div>
        </div>
        <motion.p
            className="text-green-400 text-sm font-mono tracking-widest"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
        >
            ENCRYPTING DATA...
        </motion.p>
    </div>
);

// ============================================
// MAIN COMPONENT
// ============================================

export function GhostTerminal() {
    const [mode, setMode] = useState<'WRITE' | 'READ' | 'ENCRYPTING' | 'LOADING' | 'ERROR'>('WRITE');
    const [input, setInput] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');
    const [decryptedMessage, setDecryptedMessage] = useState('');
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);

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

        setMode('ENCRYPTING');
        await new Promise(resolve => setTimeout(resolve, 3000));

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
            try { data = JSON.parse(text); } catch { throw new Error(`Server Error (${res.status})`); }
            if (!data.success) throw new Error(data.error);

            setGeneratedLink(`${window.location.origin}/#/ghost?id=${data.id}&key=${keyString}`);
            setMode('WRITE');
        } catch (err: any) {
            setError(err.message);
            setMode('ERROR');
        }
    };

    const handleRead = async (id: string, keyStr: string) => {
        try {
            const res = await fetch(`/.netlify/functions/read-ghost?id=${id}`);
            if (res.status === 410) throw new Error("Ce message a disparu.");
            if (res.status === 404) throw new Error("Message introuvable.");

            const text = await res.text();
            let data;
            try { data = JSON.parse(text); } catch { throw new Error(`Server Error (${res.status})`); }

            const key = await importKey(keyStr);
            const decrypted = await decryptMessage(data.encryptedData, data.iv, key);

            setDecryptedMessage(decrypted);
            setTimeLeft(Math.max(0, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000)));
            setMode('READ');
            window.history.replaceState(null, '', window.location.pathname);
        } catch (err: any) {
            setError(err.message);
            setMode('ERROR');
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(generatedLink);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-green-400 font-mono relative overflow-hidden">

            {/* Dense Matrix rain */}
            <DenseMatrixRain columns={20} />

            {/* Floating binary */}
            <FloatingBinary />

            {/* Scanlines */}
            <div
                className="fixed inset-0 pointer-events-none z-20 opacity-20"
                style={{
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)',
                }}
            />

            {/* CRT glow */}
            <div
                className="fixed inset-0 pointer-events-none z-10"
                style={{
                    background: 'radial-gradient(ellipse at center, rgba(34, 197, 94, 0.03) 0%, transparent 70%)',
                }}
            />

            {/* Vignette */}
            <div
                className="fixed inset-0 pointer-events-none z-30"
                style={{
                    background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.9) 100%)',
                }}
            />

            <div className="relative z-40 min-h-screen flex flex-col items-center justify-center p-6">

                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 text-center"
                >
                    <motion.div
                        className="inline-flex items-center gap-3 px-5 py-2.5 rounded-lg bg-green-500/10 border border-green-500/30 mb-8"
                        animate={{ borderColor: ['rgba(34,197,94,0.3)', 'rgba(34,197,94,0.8)', 'rgba(34,197,94,0.3)'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <motion.span
                            className="w-2.5 h-2.5 rounded-full bg-green-500"
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        />
                        <span className="text-sm tracking-[0.3em] uppercase">SECURE CHANNEL ACTIVE</span>
                    </motion.div>

                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4">
                        <GlitchText className="text-green-400">GHOST</GlitchText>
                        <br />
                        <span className="text-green-600">PROTOCOL</span>
                    </h1>

                    <div className="flex items-center justify-center gap-4 text-green-500/50 text-xs tracking-[0.2em]">
                        <span>[ ENCRYPTED ]</span>
                        <span>•</span>
                        <span>[ ANONYMOUS ]</span>
                        <span>•</span>
                        <span>[ SELF-DESTRUCT ]</span>
                    </div>
                </motion.header>

                {/* Terminal Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="w-full max-w-2xl"
                >
                    <div className="relative rounded-xl border border-green-500/30 bg-black/90 backdrop-blur-xl overflow-hidden"
                        style={{ boxShadow: '0 0 50px rgba(34, 197, 94, 0.1), inset 0 0 50px rgba(34, 197, 94, 0.02)' }}
                    >
                        {/* Title bar */}
                        <div className="flex items-center gap-3 px-5 py-4 bg-green-500/5 border-b border-green-500/20">
                            <div className="flex gap-2">
                                <motion.div
                                    className="w-3 h-3 rounded-full bg-red-500"
                                    whileHover={{ scale: 1.2 }}
                                />
                                <motion.div
                                    className="w-3 h-3 rounded-full bg-yellow-500"
                                    whileHover={{ scale: 1.2 }}
                                />
                                <motion.div
                                    className="w-3 h-3 rounded-full bg-green-500"
                                    whileHover={{ scale: 1.2 }}
                                />
                            </div>
                            <span className="ml-4 text-xs text-green-500/60 tracking-wide">
                                ghost@mapt:~$ ./secure_message --encrypt --self-destruct
                            </span>
                        </div>

                        {/* Content */}
                        <div className="p-8 min-h-[400px]">
                            <AnimatePresence mode="wait">

                                {/* WRITE MODE */}
                                {mode === 'WRITE' && !generatedLink && (
                                    <motion.div
                                        key="write"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <div className="mb-6 text-green-500/70 text-sm">
                                            <TerminalLine text="> Initiating secure transmission..." delay={0} />
                                        </div>
                                        <div className="mb-4 text-green-500/70 text-sm">
                                            <TerminalLine text="> Enter your classified message:" delay={800} />
                                        </div>

                                        <textarea
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            className="w-full h-48 bg-black/80 text-green-400 resize-none focus:outline-none text-lg leading-relaxed placeholder-green-500/30 border border-green-500/30 rounded-lg p-4 focus:border-green-500/50 transition-colors"
                                            placeholder="Type your secret message..."
                                            autoFocus
                                        />

                                        <div className="flex justify-between items-center mt-6 pt-6 border-t border-green-500/10">
                                            <div className="flex gap-6 text-xs text-green-500/40 tracking-wider">
                                                <span>AES-256-GCM</span>
                                                <span>|</span>
                                                <span>ZERO-KNOWLEDGE</span>
                                            </div>

                                            <motion.button
                                                onClick={handleCreate}
                                                disabled={!input.trim()}
                                                className="px-8 py-3.5 bg-green-500/10 border border-green-500/50 text-green-400 font-bold rounded-xl hover:bg-green-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(34, 197, 94, 0.3)' }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <span className="flex items-center gap-3">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                                    </svg>
                                                    ENCRYPT & TRANSMIT
                                                </span>
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ENCRYPTING */}
                                {mode === 'ENCRYPTING' && (
                                    <motion.div
                                        key="encrypting"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="h-full flex flex-col items-center justify-center py-8"
                                    >
                                        <EncryptionVisual />
                                        <div className="mt-8 text-center">
                                            <p className="text-2xl font-bold mb-2">
                                                <ScrambleText text={input.slice(0, 25)} speed={50} />
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* SUCCESS */}
                                {generatedLink && (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-8"
                                    >
                                        <motion.div
                                            className="w-24 h-24 rounded-full bg-green-500/10 border-2 border-green-500/50 flex items-center justify-center mx-auto mb-8"
                                            animate={{
                                                boxShadow: ['0 0 20px rgba(34,197,94,0.2)', '0 0 50px rgba(34,197,94,0.4)', '0 0 20px rgba(34,197,94,0.2)'],
                                            }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <motion.svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={2}
                                                stroke="currentColor"
                                                className="w-12 h-12 text-green-400"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.2, type: 'spring' }}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                            </motion.svg>
                                        </motion.div>

                                        <h3 className="text-3xl font-bold mb-3">TRANSMISSION COMPLETE</h3>
                                        <p className="text-green-500/50 text-sm mb-8">Encrypted link ready for deployment</p>

                                        <div className="bg-black/50 border border-green-500/30 rounded-xl p-4 flex items-center gap-4 mb-8">
                                            <code className="text-xs text-green-400/70 truncate flex-1">
                                                {generatedLink}
                                            </code>
                                            <motion.button
                                                onClick={copyLink}
                                                className="px-5 py-2.5 bg-green-500/20 border border-green-500/50 rounded-lg text-sm font-bold hover:bg-green-500/30 transition-all"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                {copySuccess ? '✓ COPIED' : 'COPY'}
                                            </motion.button>
                                        </div>

                                        <button
                                            onClick={() => { setGeneratedLink(''); setInput(''); }}
                                            className="text-green-500/50 hover:text-green-400 text-sm transition-colors tracking-wider"
                                        >
                                            [ CREATE ANOTHER ]
                                        </button>
                                    </motion.div>
                                )}

                                {/* READ MODE */}
                                {mode === 'READ' && (
                                    <motion.div
                                        key="read"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        <div className="mb-6 text-green-500/70 text-sm">
                                            <TerminalLine text="> Decryption successful. Message retrieved:" delay={0} />
                                        </div>

                                        <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-xl mb-8">
                                            <p className="text-green-400 text-lg leading-relaxed whitespace-pre-wrap">
                                                {decryptedMessage}
                                            </p>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3 text-red-400 text-sm">
                                                <motion.span
                                                    className="w-2.5 h-2.5 rounded-full bg-red-500"
                                                    animate={{ opacity: [1, 0.2, 1] }}
                                                    transition={{ duration: 0.5, repeat: Infinity }}
                                                />
                                                <span className="tracking-wider">MESSAGE BURNED</span>
                                            </div>
                                            <button
                                                onClick={() => window.location.href = '/'}
                                                className="text-green-500/50 hover:text-green-400 text-sm transition-colors tracking-wider"
                                            >
                                                [ EXIT ]
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* LOADING */}
                                {mode === 'LOADING' && (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center justify-center py-16"
                                    >
                                        <motion.div
                                            className="w-16 h-16 border-2 border-green-500/30 border-t-green-500 rounded-full"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        />
                                        <p className="mt-8 text-green-500/60 text-sm tracking-[0.3em]">DECRYPTING...</p>
                                    </motion.div>
                                )}

                                {/* ERROR */}
                                {mode === 'ERROR' && (
                                    <motion.div
                                        key="error"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-8"
                                    >
                                        <motion.div
                                            className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/50 flex items-center justify-center mx-auto mb-4"
                                            animate={{ scale: [1, 1.05, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-red-400 flex-shrink-0">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                            </svg>
                                        </motion.div>
                                        <h3 className="text-xl font-bold text-red-400 mb-2">TRANSMISSION ERROR</h3>
                                        <p className="text-red-400/60 text-sm mb-6">{error}</p>
                                        <button
                                            onClick={() => { setMode('WRITE'); setError(''); }}
                                            className="px-6 py-2.5 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/20 transition-all text-sm"
                                        >
                                            RETRY
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>

                {/* Footer */}
                <motion.footer
                    className="mt-12 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <p className="text-green-500/30 text-xs tracking-[0.4em]">
                        [ GHOST PROTOCOL v3.0 ] [ QUANTUM ENCRYPTED ] [ SELF-DESTRUCT ENABLED ]
                    </p>
                </motion.footer>
            </div>
        </div>
    );
}
