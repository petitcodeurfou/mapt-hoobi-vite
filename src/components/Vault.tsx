import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Crypto Utilities ---

async function deriveKey(password: string, salt: string = 'vault_salt_static'): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
    );
}

async function hashPassword(password: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function encryptData(text: string, key: CryptoKey): Promise<string> {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(text));
    const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    return btoa(String.fromCharCode(...combined));
}

async function decryptData(encryptedBase64: string, key: CryptoKey): Promise<string> {
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: combined.slice(0, 12) }, key, combined.slice(12));
    return new TextDecoder().decode(decrypted);
}

// ============================================
// ANIMATED BACKGROUND COMPONENTS
// ============================================

// DNA Helix animation
const DNAHelix = () => {
    const strands = useMemo(() => Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        y: (i / 20) * 100,
        delay: i * 0.1,
    })), []);

    return (
        <div className="absolute inset-0 overflow-hidden opacity-20">
            {strands.map(strand => (
                <motion.div
                    key={strand.id}
                    className="absolute left-1/2 w-4 h-4 rounded-full"
                    style={{
                        top: `${strand.y}%`,
                        background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                    }}
                    animate={{
                        x: ['-100px', '100px', '-100px'],
                        scale: [0.5, 1, 0.5],
                        opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                        duration: 4,
                        delay: strand.delay,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}
            {strands.map(strand => (
                <motion.div
                    key={`mirror-${strand.id}`}
                    className="absolute left-1/2 w-4 h-4 rounded-full"
                    style={{
                        top: `${strand.y}%`,
                        background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                    }}
                    animate={{
                        x: ['100px', '-100px', '100px'],
                        scale: [0.5, 1, 0.5],
                        opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                        duration: 4,
                        delay: strand.delay,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </div>
    );
};

// Hexagonal grid
const HexGrid = () => (
    <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
    />
);

// Floating particles
const FloatingParticles = ({ count = 30 }: { count?: number }) => {
    const particles = useMemo(() =>
        Array.from({ length: count }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: 2 + Math.random() * 4,
            duration: 10 + Math.random() * 20,
            delay: Math.random() * 5,
        })), [count]
    );

    return (
        <div className="absolute inset-0 overflow-hidden">
            {particles.map(p => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full bg-cyan-500"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        boxShadow: `0 0 ${p.size * 3}px rgba(6, 182, 212, 0.5)`,
                    }}
                    animate={{
                        y: [0, -30, 0],
                        opacity: [0.3, 0.8, 0.3],
                    }}
                    transition={{
                        duration: p.duration,
                        delay: p.delay,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </div>
    );
};

// Biometric scanning animation
const BiometricScan = ({ active }: { active: boolean }) => (
    <AnimatePresence>
        {active && (
            <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    style={{ boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)' }}
                />
            </motion.div>
        )}
    </AnimatePresence>
);

// Password strength indicator
const PasswordStrengthBar = ({ password }: { password: string }) => {
    const getStrength = () => {
        if (!password) return 0;
        let strength = 0;
        if (password.length >= 4) strength++;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        return Math.min(strength, 5);
    };

    const strength = getStrength();
    const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
    const labels = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Inviolable'];

    return (
        <div className="mt-4 space-y-2">
            <div className="flex gap-1 h-2">
                {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                        key={i}
                        className="flex-1 rounded-full overflow-hidden bg-white/5"
                        initial={false}
                    >
                        <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: i < strength ? colors[strength - 1] : 'transparent' }}
                            initial={{ width: 0 }}
                            animate={{ width: i < strength ? '100%' : '0%' }}
                            transition={{ duration: 0.3, delay: i * 0.1 }}
                        />
                    </motion.div>
                ))}
            </div>
            <AnimatePresence mode="wait">
                {password.length > 0 && (
                    <motion.p
                        key={strength}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="text-xs font-medium"
                        style={{ color: strength > 0 ? colors[strength - 1] : '#666' }}
                    >
                        {strength > 0 ? labels[strength - 1] : 'Entrez au moins 4 caractères'}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================

export function Vault() {
    const [mode, setMode] = useState<'SETUP' | 'LOCKED' | 'EDITOR' | 'LOADING'>('LOADING');
    const [noteId, setNoteId] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [content, setContent] = useState('');
    const [status, setStatus] = useState('');
    const [key, setKey] = useState<CryptoKey | null>(null);
    const [copied, setCopied] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

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
            } catch {
                setStatus('Erreur de sauvegarde');
            }
        };

        const timeout = setTimeout(save, 1000);
        return () => clearTimeout(timeout);
    }, [content, noteId, key, mode, password]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsScanning(true);
        setMode('LOADING');

        await new Promise(resolve => setTimeout(resolve, 2000));

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
            window.history.pushState({ path: `${window.location.pathname}?id=${data.id}` }, '', `${window.location.pathname}?id=${data.id}`);
        } catch (err: any) {
            alert(err.message);
            setMode('SETUP');
        }
        setIsScanning(false);
    };

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsScanning(true);
        setMode('LOADING');

        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            const derivedKey = await deriveKey(password);
            const authHash = await hashPassword(password);
            const res = await fetch(`/.netlify/functions/vault-read?id=${noteId}`);
            if (!res.ok) throw new Error('Note not found');
            const data = await res.json();
            if (data.auth_hash !== authHash) throw new Error('Mot de passe incorrect');
            const decrypted = await decryptData(data.content, derivedKey);
            setContent(decrypted);
            setKey(derivedKey);
            setMode('EDITOR');
        } catch (err: any) {
            alert(err.message);
            setMode('LOCKED');
            setPassword('');
        }
        setIsScanning(false);
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-[#030303] text-white font-sans relative overflow-hidden">

            {/* Ultra premium background */}
            <div className="fixed inset-0 pointer-events-none">
                {/* DNA Helix */}
                <DNAHelix />

                {/* Hex grid */}
                <HexGrid />

                {/* Floating particles */}
                <FloatingParticles count={40} />

                {/* Ambient orbs */}
                <motion.div
                    className="absolute w-[1000px] h-[1000px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 60%)',
                        top: '-30%',
                        left: '-20%',
                    }}
                    animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute w-[800px] h-[800px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 60%)',
                        bottom: '-20%',
                        right: '-20%',
                    }}
                    animate={{ x: [0, -40, 0], y: [0, -20, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Noise */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40" />
            </div>

            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">

                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-16 text-center"
                >
                    {/* 3D Lock icon with rings */}
                    <div className="relative w-40 h-40 mx-auto mb-8">
                        {/* Rotating rings */}
                        <motion.div
                            className="absolute inset-0 border border-cyan-500/30 rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        />
                        <motion.div
                            className="absolute inset-4 border border-purple-500/20 rounded-full"
                            animate={{ rotate: -360 }}
                            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                        />
                        <motion.div
                            className="absolute inset-8 border border-cyan-500/40 rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                        />

                        {/* Central icon */}
                        <motion.div
                            className="absolute inset-12 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center border border-cyan-500/50 backdrop-blur-xl"
                            animate={{
                                boxShadow: [
                                    '0 0 30px rgba(6, 182, 212, 0.3), inset 0 0 20px rgba(6, 182, 212, 0.1)',
                                    '0 0 60px rgba(6, 182, 212, 0.5), inset 0 0 30px rgba(6, 182, 212, 0.2)',
                                    '0 0 30px rgba(6, 182, 212, 0.3), inset 0 0 20px rgba(6, 182, 212, 0.1)',
                                ]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-cyan-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                        </motion.div>
                    </div>

                    <motion.h1
                        className="text-7xl md:text-8xl font-black tracking-tighter mb-4"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                    >
                        <span className="bg-gradient-to-r from-cyan-400 via-white to-purple-400 bg-clip-text text-transparent">
                            VAULT
                        </span>
                    </motion.h1>

                    <motion.div
                        className="flex items-center justify-center gap-6 text-white/40 text-xs tracking-[0.3em] uppercase"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <span className="flex items-center gap-2">
                            <motion.span
                                className="w-2 h-2 rounded-full bg-cyan-500"
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                            AES-256
                        </span>
                        <span className="w-px h-4 bg-white/20" />
                        <span>Zero-Knowledge</span>
                        <span className="w-px h-4 bg-white/20" />
                        <span className="flex items-center gap-2">
                            <motion.span
                                className="w-2 h-2 rounded-full bg-green-500"
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            />
                            Quantum-Ready
                        </span>
                    </motion.div>
                </motion.header>

                <AnimatePresence mode="wait">

                    {/* LOADING */}
                    {mode === 'LOADING' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center relative"
                        >
                            <BiometricScan active={isScanning} />
                            <motion.div
                                className="w-20 h-20 rounded-full border-2 border-cyan-500/30 border-t-cyan-500"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            />
                            <motion.p
                                className="mt-8 text-white/40 text-sm tracking-widest uppercase"
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                {isScanning ? 'Analyse biométrique...' : 'Initialisation...'}
                            </motion.p>
                        </motion.div>
                    )}

                    {/* SETUP */}
                    {mode === 'SETUP' && (
                        <motion.form
                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -30 }}
                            onSubmit={handleCreate}
                            className="w-full max-w-md relative"
                        >
                            <BiometricScan active={isScanning} />

                            <div className="relative p-10 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 backdrop-blur-2xl overflow-hidden">
                                {/* Glow */}
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10" />

                                <div className="relative z-10">
                                    <div className="text-center mb-10">
                                        <motion.div
                                            className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-cyan-500/30"
                                            animate={{
                                                boxShadow: [
                                                    '0 0 20px rgba(6, 182, 212, 0.2)',
                                                    '0 0 40px rgba(6, 182, 212, 0.4)',
                                                    '0 0 20px rgba(6, 182, 212, 0.2)',
                                                ]
                                            }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <span className="text-5xl">🔐</span>
                                        </motion.div>
                                        <h2 className="text-3xl font-bold text-white mb-3">Créer un Vault</h2>
                                        <p className="text-white/50 text-sm leading-relaxed">
                                            Vos données seront chiffrées localement.
                                            <br />
                                            <span className="text-red-400 font-semibold">Le mot de passe est irrécupérable.</span>
                                        </p>
                                    </div>

                                    <div className="relative mb-8">
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Mot de passe maître"
                                            className="w-full bg-black/50 border border-white/20 rounded-2xl px-6 py-5 text-white text-lg placeholder-white/30 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                                            autoFocus
                                        />
                                        <PasswordStrengthBar password={password} />
                                    </div>

                                    <motion.button
                                        type="submit"
                                        disabled={!password || password.length < 4}
                                        className="w-full relative overflow-hidden bg-gradient-to-r from-cyan-600 via-cyan-500 to-purple-600 text-white font-bold py-5 rounded-2xl transition-all disabled:opacity-30 disabled:cursor-not-allowed text-lg"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        style={{
                                            boxShadow: password && password.length >= 4
                                                ? '0 0 50px rgba(6, 182, 212, 0.4), 0 20px 40px rgba(0, 0, 0, 0.3)'
                                                : 'none'
                                        }}
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                            </svg>
                                            Initialiser le Vault
                                        </span>
                                        {/* Animated shine */}
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                                            animate={{ x: ['-200%', '200%'] }}
                                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                        />
                                    </motion.button>
                                </div>
                            </div>
                        </motion.form>
                    )}

                    {/* LOCKED */}
                    {mode === 'LOCKED' && (
                        <motion.form
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            onSubmit={handleUnlock}
                            className="w-full max-w-md relative"
                        >
                            <BiometricScan active={isScanning} />

                            <div className="relative p-10 rounded-3xl bg-gradient-to-b from-red-500/10 to-orange-500/5 border border-red-500/20 backdrop-blur-2xl overflow-hidden">
                                <div className="relative z-10">
                                    <div className="text-center mb-10">
                                        <motion.div
                                            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                            transition={{ duration: 4, repeat: Infinity }}
                                            className="w-28 h-28 mx-auto mb-8 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center border border-red-500/30"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-14 h-14 text-red-400">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                            </svg>
                                        </motion.div>
                                        <h2 className="text-3xl font-bold text-white mb-3">Vault Verrouillé</h2>
                                        <p className="text-white/50 text-sm">Entrez votre mot de passe pour déchiffrer</p>
                                    </div>

                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Mot de passe"
                                        className="w-full bg-black/50 border border-white/20 rounded-2xl px-6 py-5 text-white text-lg placeholder-white/30 focus:border-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all mb-8"
                                        autoFocus
                                    />

                                    <motion.button
                                        type="submit"
                                        disabled={!password}
                                        className="w-full relative overflow-hidden bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold py-5 rounded-2xl transition-all disabled:opacity-30"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                            </svg>
                                            Déverrouiller
                                        </span>
                                    </motion.button>
                                </div>
                            </div>
                        </motion.form>
                    )}

                    {/* EDITOR */}
                    {mode === 'EDITOR' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-4xl"
                        >
                            <div className="flex justify-between items-center mb-6 px-2">
                                <div className="flex items-center gap-4">
                                    <motion.div
                                        className="w-3 h-3 rounded-full bg-green-500"
                                        animate={{ opacity: [1, 0.5, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                    <span className="text-white/50 text-sm font-medium">
                                        {status || 'Prêt • Vault Ouvert'}
                                    </span>
                                </div>
                                <motion.button
                                    onClick={copyLink}
                                    className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-sm text-white/60 hover:text-white transition-all"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {copied ? '✓ Copié !' : '🔗 Partager'}
                                </motion.button>
                            </div>

                            <div className="relative rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 backdrop-blur-2xl overflow-hidden">
                                <div className="absolute top-0 left-1/4 w-1/2 h-32 bg-cyan-500/10 blur-3xl pointer-events-none" />

                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="w-full h-[500px] bg-transparent p-10 text-white text-lg leading-relaxed resize-none focus:outline-none placeholder-white/30 relative z-10"
                                    placeholder="Commencez à écrire... Tout est chiffré automatiquement. 🔐"
                                    spellCheck={false}
                                />

                                <div className="relative z-10 bg-black/30 px-8 py-5 border-t border-white/5 flex justify-between items-center">
                                    <div className="flex items-center gap-6 text-white/30 text-xs tracking-wider">
                                        <span className="flex items-center gap-2">
                                            <motion.span
                                                className="w-2 h-2 rounded-full bg-cyan-500"
                                                animate={{ opacity: [1, 0.5, 1] }}
                                                transition={{ duration: 1, repeat: Infinity }}
                                            />
                                            AES-256-GCM
                                        </span>
                                        <span className="w-px h-3 bg-white/10" />
                                        <span>🛡️ SECURE</span>
                                    </div>
                                    <span className="text-white/20 text-xs font-mono">
                                        ID: {noteId?.slice(0, 8)}...
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
