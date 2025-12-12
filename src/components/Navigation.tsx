import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserButton } from '@clerk/clerk-react';

// Import Icons
import iconHome from '../assets/icons/home.png';
import iconGhost from '../assets/icons/ghost.png';
import iconAI from '../assets/icons/ai.png';
import iconVault from '../assets/icons/vault.png';
import iconMessages from '../assets/icons/messages.png';

export function Navigation() {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const apps = [
        {
            id: 'home',
            path: '/',
            aria: 'Mapt Home',
            image: iconHome,
        },
        {
            id: 'ghost',
            path: '/ghost',
            aria: 'Ghost Protocol',
            image: iconGhost,
        },
        {
            id: 'vault',
            path: '/vault',
            aria: 'Secure Vault',
            image: iconVault,
        },
        {
            id: 'messages',
            path: '/messages',
            aria: 'Messages',
            image: iconMessages,
            experimental: true
        },
        {
            id: 'ai',
            path: 'https://glittering-alfajores-8099c1.netlify.app/',
            aria: 'Gemini Interface',
            image: iconAI,
            external: true
        },
    ];

    return (
        <nav className="fixed top-0 right-0 z-50 p-6 flex justify-end items-center gap-6 pointer-events-none">
            <div className="pointer-events-auto relative" ref={menuRef}>
                {/* App Launcher Icon (9 dots) */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${isOpen ? 'bg-white/20 backdrop-blur-md' : 'hover:bg-white/10'}`}
                    aria-label="App Launcher"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                        <circle cx="5" cy="5" r="2" />
                        <circle cx="12" cy="5" r="2" />
                        <circle cx="19" cy="5" r="2" />
                        <circle cx="5" cy="12" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="19" cy="12" r="2" />
                        <circle cx="5" cy="19" r="2" />
                        <circle cx="12" cy="19" r="2" />
                        <circle cx="19" cy="19" r="2" />
                    </svg>
                </button>

                {/* Dropdown Menu - Icon Grid Only */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-16 right-0 w-[320px] bg-[#1c1c1e]/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden p-6"
                        >
                            <div className="grid grid-cols-3 gap-6">
                                {apps.map((app) => (
                                    app.external ? (
                                        <a
                                            key={app.id}
                                            href={app.path}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => setIsOpen(false)}
                                            className="flex flex-col items-center gap-2 group"
                                            title={app.aria}
                                        >
                                            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-200 border border-white/10">
                                                <img
                                                    src={app.image}
                                                    alt={app.aria}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </a>
                                    ) : (
                                        <Link
                                            key={app.id}
                                            to={app.path}
                                            onClick={() => setIsOpen(false)}
                                            className="flex flex-col items-center gap-2 group"
                                            title={app.aria}
                                        >
                                            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-200 border border-white/10">
                                                <img
                                                    src={app.image}
                                                    alt={app.aria}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </Link>
                                    )
                                ))}

                                {/* Placeholder for future apps */}
                                <div className="flex flex-col items-center gap-2 opacity-30 cursor-not-allowed">
                                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border-2 border-dashed border-white/20">
                                        <span className="text-2xl text-white">+</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* User Account Button - à droite du menu */}
            <div className="pointer-events-auto" style={{ marginLeft: '1cm' }}>
                <UserButton
                    appearance={{
                        elements: {
                            avatarBox: "w-10 h-10"
                        }
                    }}
                />
            </div>
        </nav>
    );
}
