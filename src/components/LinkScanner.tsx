import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScanResult {
    url: string;
    status: number;
    title: string;
    description: string;
    image: string | null;
    keywords: string | null;
    author: string | null;
    themeColor: string | null;
    security: {
        [key: string]: string;
    };
    server: string;
    contentType: string;
    size: number;
    isCaptcha?: boolean;
    securityScore?: number;
    aiSummary?: string | null;
}

export function LinkScanner() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Chat states
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [siteContent, setSiteContent] = useState('');
    const [screenshotLoading, setScreenshotLoading] = useState(true);

    const handleScan = async () => {
        if (!url) return;
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('/.netlify/functions/link-scanner', {
                method: 'POST',
                body: JSON.stringify({ url }),
            });

            const data = await response.json();

            if (response.ok) {
                setResult(data);
                setSiteContent(data.description || '');
                setChatMessages([]);
                setScreenshotLoading(true);
            } else {
                setError(data.error || 'Impossible de scanner l\'URL');
            }
        } catch (err) {
            setError('Erreur réseau. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    const getSecurityScore = (result: ScanResult) => {
        return result.securityScore || 0;
    };

    const getThreatLevel = (score: number) => {
        if (score >= 80) return { label: 'SÉCURISÉ', color: '#22c55e', icon: '🛡️' };
        if (score >= 50) return { label: 'MODÉRÉ', color: '#eab308', icon: '⚠️' };
        return { label: 'RISQUE ÉLEVÉ', color: '#ef4444', icon: '💀' };
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white font-sans relative overflow-hidden p-6">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[150px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto pt-20">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-xs tracking-widest uppercase text-white/60">Cyber Intelligence</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">
                        <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            LINK
                        </span>
                        <span className="text-white"> SCANNER</span>
                    </h1>
                    <p className="text-white/40 text-lg">Analyse approfondie de sécurité et métadonnées</p>
                </motion.div>

                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex gap-4 mb-12 max-w-2xl mx-auto"
                >
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                            placeholder="Entrez une URL (ex: google.com)..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-6 pr-4 py-4 text-xl text-white placeholder-white/30 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                            <span className="px-2 py-1 rounded bg-white/10 text-xs text-white/40 font-mono">HTTP/S</span>
                        </div>
                    </div>
                    <motion.button
                        onClick={handleScan}
                        disabled={loading || !url}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-600/20"
                    >
                        {loading ? (
                            <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                        )}
                        SCANNER
                    </motion.button>
                </motion.div>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8 text-center max-w-2xl mx-auto"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Results */}
                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                        >
                            {/* Left Column: Visual & Meta */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Main Card */}
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-32 h-32">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                                        </svg>
                                    </div>

                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between mb-6">
                                            <div>
                                                <h2 className="text-3xl font-bold mb-2 text-white">{result.title}</h2>
                                                <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors text-sm flex items-center gap-2 font-mono">
                                                    {result.url}
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                                    </svg>
                                                </a>
                                            </div>
                                            <div className={`px-4 py-2 rounded-xl text-sm font-bold border ${result.status === 200 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                                HTTP {result.status}
                                            </div>
                                        </div>

                                        {result.image && (
                                            <div className="mb-6 rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative group">
                                                <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur rounded text-xs font-bold text-white/80 z-10">
                                                    IMAGE SOCIALE
                                                </div>
                                                <img src={result.image} alt="Aperçu social" className="w-full h-64 object-cover hover:scale-105 transition-transform duration-700" />
                                            </div>
                                        )}

                                        {/* LIVE SCREENSHOT */}
                                        {!result.isCaptcha ? (
                                            <div className="mb-6 rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative group">
                                                <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600/80 backdrop-blur rounded text-xs font-bold text-white z-10 flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                                    CAPTURE EN DIRECT
                                                </div>
                                                {screenshotLoading && (
                                                    <div className="w-full h-48 bg-white/5 flex items-center justify-center">
                                                        <svg className="animate-spin h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                    </div>
                                                )}
                                                <img
                                                    src={`https://image.thum.io/get/width/1200/crop/800/noanimate/${result.url}`}
                                                    alt="Capture d'écran du site"
                                                    className={`w-full h-auto object-cover hover:scale-105 transition-transform duration-700 ${screenshotLoading ? 'hidden' : ''}`}
                                                    loading="lazy"
                                                    onLoad={() => setScreenshotLoading(false)}
                                                    onError={() => setScreenshotLoading(false)}
                                                />
                                            </div>
                                        ) : (
                                            <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 flex flex-col items-center justify-center text-center gap-3">
                                                <div className="p-3 rounded-full bg-red-500/10 text-red-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                    </svg>
                                                </div>
                                                <h4 className="text-red-400 font-bold">Capture désactivée</h4>
                                                <p className="text-white/40 text-sm">Protection Anti-Robot détectée (CAPTCHA/Cloudflare)</p>
                                            </div>
                                        )}

                                        <div className="bg-white/5 rounded-xl p-6 border border-white/5">
                                            <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3">Description</h3>
                                            <p className="text-white/80 leading-relaxed">{result.description}</p>
                                        </div>

                                        {/* AI Summary */}
                                        {result.aiSummary && (
                                            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20 relative overflow-hidden mt-6">
                                                <div className="absolute top-0 right-0 p-4 opacity-20">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-blue-400">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                                    Analyse IA
                                                </h3>
                                                <p className="text-white/90 leading-relaxed font-medium relative z-10">
                                                    {result.aiSummary}
                                                </p>
                                            </div>
                                        )}

                                        {/* AI Chat */}
                                        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20 mt-6">
                                            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                💬 Discuter avec l'IA
                                            </h3>

                                            {/* Chat Messages */}
                                            <div className="max-h-60 overflow-y-auto space-y-3 mb-4">
                                                {chatMessages.length === 0 && !chatLoading && (
                                                    <div className="text-center py-4 text-white/30 text-sm">
                                                        Posez une question sur ce site...
                                                    </div>
                                                )}
                                                {chatMessages.map((msg, idx) => (
                                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-purple-500/30 text-white' : 'bg-white/10 text-white/90'}`}>
                                                            {msg.content}
                                                        </div>
                                                    </div>
                                                ))}
                                                {chatLoading && (
                                                    <div className="flex justify-start">
                                                        <div className="bg-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                                            <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                                            <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Chat Input */}
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={chatInput}
                                                    onChange={(e) => setChatInput(e.target.value)}
                                                    onKeyDown={async (e) => {
                                                        if (e.key === 'Enter' && chatInput.trim() && !chatLoading) {
                                                            const userMessage = chatInput.trim();
                                                            setChatInput('');
                                                            setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
                                                            setChatLoading(true);
                                                            try {
                                                                const res = await fetch('/.netlify/functions/ai-chat', {
                                                                    method: 'POST',
                                                                    body: JSON.stringify({
                                                                        message: userMessage,
                                                                        siteUrl: result.url,
                                                                        siteContent: siteContent,
                                                                        history: chatMessages
                                                                    })
                                                                });
                                                                const data = await res.json();
                                                                setChatMessages(prev => [...prev, { role: 'assistant', content: data.response || 'Erreur' }]);
                                                            } catch {
                                                                setChatMessages(prev => [...prev, { role: 'assistant', content: 'Erreur de connexion' }]);
                                                            } finally {
                                                                setChatLoading(false);
                                                            }
                                                        }
                                                    }}
                                                    placeholder="Posez une question sur ce site..."
                                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-purple-500/50 focus:outline-none"
                                                />
                                                <button
                                                    onClick={async () => {
                                                        if (chatInput.trim() && !chatLoading) {
                                                            const userMessage = chatInput.trim();
                                                            setChatInput('');
                                                            setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
                                                            setChatLoading(true);
                                                            try {
                                                                const res = await fetch('/.netlify/functions/ai-chat', {
                                                                    method: 'POST',
                                                                    body: JSON.stringify({
                                                                        message: userMessage,
                                                                        siteUrl: result.url,
                                                                        siteContent: siteContent,
                                                                        history: chatMessages
                                                                    })
                                                                });
                                                                const data = await res.json();
                                                                setChatMessages(prev => [...prev, { role: 'assistant', content: data.response || 'Erreur' }]);
                                                            } catch {
                                                                setChatMessages(prev => [...prev, { role: 'assistant', content: 'Erreur de connexion' }]);
                                                            } finally {
                                                                setChatLoading(false);
                                                            }
                                                        }
                                                    }}
                                                    disabled={chatLoading || !chatInput.trim()}
                                                    className="px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors disabled:opacity-50"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tech Stack */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.072 0 2.031.52 2.7 1.35l3.738 4.663A4.5 4.5 0 0121 12.25H5.25z" />
                                                </svg>
                                            </div>
                                            <span className="text-white/60 font-medium">Serveur</span>
                                        </div>
                                        <p className="text-xl font-bold truncate">{result.server}</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                                                </svg>
                                            </div>
                                            <span className="text-white/60 font-medium">Type de contenu</span>
                                        </div>
                                        <p className="text-xl font-bold truncate">{result.contentType.split(';')[0]}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Security Analysis */}
                            <div className="space-y-6">
                                {/* Security Score Card */}
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl flex flex-col items-center text-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />

                                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 relative z-10">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-400">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                        </svg>
                                        Analyse de Sécurité
                                    </h3>

                                    <div className="relative w-48 h-48 mb-6 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/5" />
                                            <motion.circle
                                                cx="96" cy="96" r="88"
                                                stroke="currentColor" strokeWidth="12" fill="transparent"
                                                className="text-blue-500"
                                                strokeDasharray={2 * Math.PI * 88}
                                                strokeDashoffset={2 * Math.PI * 88}
                                                animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - getSecurityScore(result) / 100) }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                                style={{ color: getThreatLevel(getSecurityScore(result)).color }}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-5xl font-black" style={{ color: getThreatLevel(getSecurityScore(result)).color }}>
                                                {getSecurityScore(result)}%
                                            </span>
                                            <span className="text-xs uppercase tracking-widest text-white/40 mt-1">Score</span>
                                        </div>
                                    </div>

                                    <div className="px-4 py-2 rounded-full border bg-white/5 mb-2" style={{ borderColor: getThreatLevel(getSecurityScore(result)).color }}>
                                        <span className="font-bold flex items-center gap-2" style={{ color: getThreatLevel(getSecurityScore(result)).color }}>
                                            {getThreatLevel(getSecurityScore(result)).icon}
                                            {getThreatLevel(getSecurityScore(result)).label}
                                        </span>
                                    </div>
                                </div>

                                {/* Security Headers List */}
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                                    <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">Protocoles de Sécurité</h3>
                                    <div className="space-y-3">
                                        {Object.entries(result.security).map(([key, value]) => (
                                            <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-white/90">{key}</span>
                                                    <span className="text-xs text-white/40">Header</span>
                                                </div>
                                                {value !== 'Missing' ? (
                                                    <div className="p-1.5 rounded-full bg-green-500/20 text-green-400">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                    </div>
                                                ) : (
                                                    <div className="p-1.5 rounded-full bg-red-500/20 text-red-400">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
