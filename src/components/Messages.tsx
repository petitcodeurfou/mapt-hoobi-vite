import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    id: string;
    from_email: string;
    subject: string;
    content: string;
    read: boolean;
    created_at: string;
}

// Avatar gradient generator
const getAvatarGradient = (email: string) => {
    const gradients = [
        'from-violet-500 to-purple-600',
        'from-blue-500 to-cyan-500',
        'from-emerald-500 to-teal-500',
        'from-orange-500 to-red-500',
        'from-pink-500 to-rose-500',
        'from-indigo-500 to-blue-500',
        'from-amber-500 to-orange-500',
    ];
    const index = email.charCodeAt(0) % gradients.length;
    return gradients[index];
};

// Floating orb component
const FloatingOrb = ({ color, size, position, delay }: {
    color: string;
    size: string;
    position: { top?: string; bottom?: string; left?: string; right?: string };
    delay: number;
}) => (
    <motion.div
        className={`absolute ${size} rounded-full blur-[100px] ${color}`}
        style={position}
        animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 30, 0],
            scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
            duration: 15 + delay * 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay,
        }}
    />
);

export function Messages() {
    const { user } = useUser();
    const [view, setView] = useState<'inbox' | 'compose' | 'read'>('inbox');
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [loading, setLoading] = useState(true);

    // Compose form
    const [toEmail, setToEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);

    const userEmail = user?.primaryEmailAddress?.emailAddress;

    useEffect(() => {
        if (!userEmail) return;
        loadInbox();
    }, [userEmail]);

    const loadInbox = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/.netlify/functions/messages-inbox?email=${encodeURIComponent(userEmail!)}`);
            if (!res.ok) {
                setMessages([]);
                setLoading(false);
                return;
            }
            const data = await res.json();
            if (Array.isArray(data)) {
                setMessages(data);
            } else {
                setMessages([]);
            }
        } catch (e) {
            console.error('Failed to load messages:', e);
            setMessages([]);
        }
        setLoading(false);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!toEmail || !subject || !content) return;

        setSending(true);
        try {
            const res = await fetch('/.netlify/functions/messages-send', {
                method: 'POST',
                body: JSON.stringify({
                    fromUserId: user?.id,
                    fromEmail: userEmail,
                    toEmail,
                    subject,
                    content
                })
            });

            if (res.ok) {
                setToEmail('');
                setSubject('');
                setContent('');
                setView('inbox');
            }
        } catch (e) {
            console.error('Send failed');
        }
        setSending(false);
    };

    const openMessage = async (msg: Message) => {
        setSelectedMessage(msg);
        setView('read');

        if (!msg.read) {
            await fetch('/.netlify/functions/messages-read', {
                method: 'POST',
                body: JSON.stringify({ messageId: msg.id })
            });
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
        }
    };

    const unreadCount = messages.filter(m => !m.read).length;

    return (
        <div className="min-h-screen bg-[#0f0f12] text-white font-sans relative overflow-hidden">

            {/* Ambient background */}
            <div className="fixed inset-0 pointer-events-none">
                <FloatingOrb color="bg-purple-600/20" size="w-[600px] h-[600px]" position={{ top: '-10%', right: '-10%' }} delay={0} />
                <FloatingOrb color="bg-blue-600/15" size="w-[500px] h-[500px]" position={{ bottom: '-10%', left: '-10%' }} delay={2} />
                <FloatingOrb color="bg-cyan-500/10" size="w-[400px] h-[400px]" position={{ top: '40%', left: '50%' }} delay={4} />

                {/* Grid */}
                <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                        `,
                        backgroundSize: '60px 60px',
                    }}
                />

                {/* Noise */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30" />
            </div>

            <div className="max-w-4xl mx-auto px-6 py-24 relative z-10">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-12"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-3">
                                <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                                    Messages
                                </span>
                            </h1>
                            <div className="flex items-center gap-3 text-white/40 text-sm">
                                <motion.span
                                    className="w-2.5 h-2.5 rounded-full bg-green-500"
                                    animate={{ opacity: [1, 0.4, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                                <span>{userEmail}</span>
                                {unreadCount > 0 && (
                                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium">
                                        {unreadCount} nouveaux
                                    </span>
                                )}
                            </div>
                        </div>

                        {view !== 'compose' && (
                            <motion.button
                                onClick={() => setView('compose')}
                                className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold transition-all flex items-center gap-2"
                                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(168, 85, 247, 0.4)' }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Nouveau
                            </motion.button>
                        )}
                    </div>
                </motion.div>

                {/* Tabs */}
                {view !== 'compose' && (
                    <motion.div
                        className="flex gap-2 mb-8"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <button
                            onClick={() => { setView('inbox'); setSelectedMessage(null); }}
                            className={`px-5 py-2.5 rounded-xl font-medium transition-all ${view === 'inbox' || view === 'read'
                                ? 'bg-white/10 text-white border border-white/20'
                                : 'text-white/40 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
                                </svg>
                                Boîte de réception
                                {unreadCount > 0 && (
                                    <span className="px-2 py-0.5 bg-purple-500 text-white rounded-full text-xs font-bold">
                                        {unreadCount}
                                    </span>
                                )}
                            </span>
                        </button>
                    </motion.div>
                )}

                <AnimatePresence mode="wait">

                    {/* INBOX */}
                    {view === 'inbox' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="relative rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl overflow-hidden"
                        >
                            {/* Card glow */}
                            <div className="absolute top-0 left-1/4 w-1/2 h-32 bg-purple-500/10 blur-3xl pointer-events-none" />

                            {loading ? (
                                <div className="p-16 text-center">
                                    <motion.div
                                        className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full mx-auto mb-4"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    />
                                    <p className="text-white/40">Chargement...</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="p-10 text-center relative z-10">
                                    <motion.div
                                        className="w-14 h-14 mx-auto mb-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"
                                        animate={{ y: [0, -3, 0] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-6 h-6 text-white/30">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.98l7.5-4.04a2.25 2.25 0 012.134 0l7.5 4.04a2.25 2.25 0 011.183 1.98V19.5z" />
                                        </svg>
                                    </motion.div>
                                    <h3 className="text-lg font-bold text-white/80 mb-1">Aucun message</h3>
                                    <p className="text-white/40 text-sm mb-4">Votre boîte est vide</p>

                                    <motion.button
                                        onClick={loadInbox}
                                        className="px-5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition-all"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Actualiser
                                    </motion.button>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {messages.map((msg, index) => (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => openMessage(msg)}
                                            className={`p-5 cursor-pointer transition-all group relative ${!msg.read
                                                ? 'bg-gradient-to-r from-purple-500/10 to-transparent'
                                                : 'hover:bg-white/5'
                                                }`}
                                        >
                                            {/* Unread indicator */}
                                            {!msg.read && (
                                                <motion.div
                                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-purple-500 to-pink-500 rounded-r-full"
                                                    animate={{ opacity: [1, 0.5, 1] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                />
                                            )}

                                            <div className="flex items-start gap-4 pl-2">
                                                <motion.div
                                                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs bg-gradient-to-br ${getAvatarGradient(msg.from_email)}`}
                                                    whileHover={{ scale: 1.05 }}
                                                    style={{ boxShadow: '0 5px 15px rgba(0,0,0,0.2)' }}
                                                >
                                                    {msg.from_email.charAt(0).toUpperCase()}
                                                </motion.div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className={`font-semibold ${!msg.read ? 'text-white' : 'text-white/70'}`}>
                                                            {msg.from_email}
                                                        </span>
                                                        <span className="text-white/30 text-sm">
                                                            {new Date(msg.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                    </div>
                                                    <p className={`font-medium truncate mb-1 ${!msg.read ? 'text-white' : 'text-white/60'}`}>
                                                        {msg.subject}
                                                    </p>
                                                    <p className="text-white/40 text-sm truncate">
                                                        {msg.content.substring(0, 80)}...
                                                    </p>
                                                </div>

                                                <motion.svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={2}
                                                    stroke="currentColor"
                                                    className="w-5 h-5 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    whileHover={{ x: 3 }}
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                                </motion.svg>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* READ MESSAGE */}
                    {view === 'read' && selectedMessage && (
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="relative rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-white/10">
                                <motion.button
                                    onClick={() => { setView('inbox'); setSelectedMessage(null); }}
                                    className="text-white/40 hover:text-white mb-6 flex items-center gap-2 font-medium transition-colors"
                                    whileHover={{ x: -3 }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                    </svg>
                                    Retour
                                </motion.button>

                                <h2 className="text-3xl font-bold text-white mb-6">{selectedMessage.subject}</h2>

                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br ${getAvatarGradient(selectedMessage.from_email)}`}>
                                        {selectedMessage.from_email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">{selectedMessage.from_email}</p>
                                        <p className="text-white/40 text-sm">
                                            {new Date(selectedMessage.created_at).toLocaleString('fr-FR')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 text-white/80 whitespace-pre-wrap leading-relaxed text-lg">
                                {selectedMessage.content}
                            </div>
                        </motion.div>
                    )}

                    {/* COMPOSE */}
                    {view === 'compose' && (
                        <motion.form
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            onSubmit={handleSend}
                            className="relative rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-white/10">
                                <motion.button
                                    type="button"
                                    onClick={() => setView('inbox')}
                                    className="text-white/40 hover:text-white mb-4 flex items-center gap-2 font-medium transition-colors"
                                    whileHover={{ x: -3 }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Annuler
                                </motion.button>

                                <h2 className="text-3xl font-bold text-white">Nouveau message</h2>
                            </div>

                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-white/50 text-sm font-medium mb-2">Destinataire</label>
                                    <input
                                        type="email"
                                        value={toEmail}
                                        onChange={(e) => setToEmail(e.target.value)}
                                        placeholder="email@example.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-white/50 text-sm font-medium mb-2">Sujet</label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Sujet du message"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-white/50 text-sm font-medium mb-2">Message</label>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Écrivez votre message..."
                                        rows={10}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="p-6 border-t border-white/10 bg-white/5">
                                <motion.button
                                    type="submit"
                                    disabled={sending}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(168, 85, 247, 0.4)' }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {sending ? (
                                        <>
                                            <motion.div
                                                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            />
                                            Envoi...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                            </svg>
                                            Envoyer
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
