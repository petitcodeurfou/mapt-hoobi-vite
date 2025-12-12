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

    // Load inbox
    useEffect(() => {
        if (!userEmail) return;
        loadInbox();
    }, [userEmail]);

    const loadInbox = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/.netlify/functions/messages-inbox?email=${encodeURIComponent(userEmail!)}`);
            const data = await res.json();
            setMessages(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Failed to load messages');
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
        <div className="min-h-screen bg-[#FDFBF7] text-[#1a1a1a] font-sans">

            <div className="max-w-3xl mx-auto px-6 py-24">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="font-serif text-4xl font-bold text-[#1a1a1a] mb-2">Messages</h1>
                            <p className="text-[#666] text-sm">{userEmail}</p>
                        </div>

                        {view !== 'compose' && (
                            <button
                                onClick={() => setView('compose')}
                                className="px-6 py-3 bg-[#1a1a1a] hover:bg-[#333] text-white rounded-full font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Nouveau
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* Tabs */}
                {view !== 'compose' && (
                    <div className="flex gap-1 mb-8 bg-[#f0ede8] p-1 rounded-xl w-fit">
                        <button
                            onClick={() => { setView('inbox'); setSelectedMessage(null); }}
                            className={`px-5 py-2.5 rounded-lg font-medium transition-all ${view === 'inbox' || view === 'read' ? 'bg-white text-[#1a1a1a] shadow-sm' : 'text-[#666] hover:text-[#1a1a1a]'}`}
                        >
                            Boîte de réception
                            {unreadCount > 0 && (
                                <span className="ml-2 px-2 py-0.5 bg-[#1a1a1a] text-white rounded-full text-xs">{unreadCount}</span>
                            )}
                        </button>
                    </div>
                )}

                <AnimatePresence mode="wait">

                    {/* INBOX */}
                    {view === 'inbox' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-[#e8e5e0] overflow-hidden"
                        >
                            {loading ? (
                                <div className="p-12 text-center text-[#999]">
                                    <div className="w-8 h-8 border-2 border-[#ddd] border-t-[#1a1a1a] rounded-full animate-spin mx-auto mb-4" />
                                    Chargement...
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-12 h-12 bg-[#f5f3ef] rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#999]">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.98l7.5-4.04a2.25 2.25 0 012.134 0l7.5 4.04a2.25 2.25 0 011.183 1.98V19.5z" />
                                        </svg>
                                    </div>
                                    <p className="text-[#999] font-medium">Aucun message</p>
                                    <p className="text-[#bbb] text-sm mt-1">Votre boîte est vide</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-[#f0ede8]">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            onClick={() => openMessage(msg)}
                                            className={`p-5 cursor-pointer hover:bg-[#faf9f7] transition-colors ${!msg.read ? 'bg-[#f8f6f2]' : ''}`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${!msg.read ? 'bg-[#1a1a1a]' : 'bg-[#999]'}`}>
                                                    {msg.from_email.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className={`font-medium ${!msg.read ? 'text-[#1a1a1a]' : 'text-[#666]'}`}>
                                                            {msg.from_email}
                                                        </span>
                                                        <span className="text-[#999] text-sm">
                                                            {new Date(msg.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                    </div>
                                                    <p className={`font-medium truncate ${!msg.read ? 'text-[#1a1a1a]' : 'text-[#666]'}`}>
                                                        {msg.subject}
                                                    </p>
                                                    <p className="text-[#999] text-sm truncate mt-0.5">
                                                        {msg.content.substring(0, 80)}...
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* READ MESSAGE */}
                    {view === 'read' && selectedMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-[#e8e5e0] overflow-hidden"
                        >
                            <div className="p-6 border-b border-[#f0ede8]">
                                <button
                                    onClick={() => { setView('inbox'); setSelectedMessage(null); }}
                                    className="text-[#999] hover:text-[#1a1a1a] mb-4 flex items-center gap-2 font-medium transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                    </svg>
                                    Retour
                                </button>

                                <h2 className="font-serif text-2xl font-bold text-[#1a1a1a] mb-4">{selectedMessage.subject}</h2>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white font-bold text-sm">
                                        {selectedMessage.from_email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-[#1a1a1a]">{selectedMessage.from_email}</p>
                                        <p className="text-[#999] text-sm">
                                            {new Date(selectedMessage.created_at).toLocaleString('fr-FR')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 text-[#333] whitespace-pre-wrap leading-relaxed text-lg">
                                {selectedMessage.content}
                            </div>
                        </motion.div>
                    )}

                    {/* COMPOSE */}
                    {view === 'compose' && (
                        <motion.form
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            onSubmit={handleSend}
                            className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-[#e8e5e0] overflow-hidden"
                        >
                            <div className="p-6 border-b border-[#f0ede8]">
                                <button
                                    type="button"
                                    onClick={() => setView('inbox')}
                                    className="text-[#999] hover:text-[#1a1a1a] mb-4 flex items-center gap-2 font-medium transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Annuler
                                </button>

                                <h2 className="font-serif text-2xl font-bold text-[#1a1a1a]">Nouveau message</h2>
                            </div>

                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-[#666] text-sm font-medium mb-2">Destinataire</label>
                                    <input
                                        type="email"
                                        value={toEmail}
                                        onChange={(e) => setToEmail(e.target.value)}
                                        placeholder="email@example.com"
                                        className="w-full bg-[#f8f6f2] border border-[#e8e5e0] rounded-xl px-4 py-3.5 text-[#1a1a1a] placeholder-[#aaa] focus:border-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 transition-all"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-[#666] text-sm font-medium mb-2">Sujet</label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Sujet du message"
                                        className="w-full bg-[#f8f6f2] border border-[#e8e5e0] rounded-xl px-4 py-3.5 text-[#1a1a1a] placeholder-[#aaa] focus:border-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 transition-all"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-[#666] text-sm font-medium mb-2">Message</label>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Écrivez votre message..."
                                        rows={10}
                                        className="w-full bg-[#f8f6f2] border border-[#e8e5e0] rounded-xl px-4 py-3.5 text-[#1a1a1a] placeholder-[#aaa] focus:border-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 transition-all resize-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="p-6 border-t border-[#f0ede8] bg-[#faf9f7]">
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="w-full bg-[#1a1a1a] hover:bg-[#333] text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
                                >
                                    {sending ? 'Envoi en cours...' : 'Envoyer le message'}
                                </button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
