import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserButton } from '@clerk/clerk-react';

// Import Icons
import iconHome from '../assets/icons/home.png';
import iconGhost from '../assets/icons/ghost.png';
import iconAI from '../assets/icons/ai.png';
import iconVault from '../assets/icons/vault.png';
import iconMessages from '../assets/icons/messages.png';
import iconScanner from '../assets/icons/scanner.png';

export function Navigation() {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const location = useLocation();

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
            color: 'from-violet-500 to-purple-600',
        },
        {
            id: 'ghost',
            path: '/ghost',
            aria: 'Ghost Protocol',
            image: iconGhost,
            color: 'from-green-500 to-emerald-600',
        },
        {
            id: 'vault',
            path: '/vault',
            aria: 'Secure Vault',
            image: iconVault,
            color: 'from-cyan-500 to-blue-600',
        },
        {
            id: 'messages',
            path: '/messages',
            aria: 'Messages',
            image: iconMessages,
            color: 'from-pink-500 to-rose-600',
            experimental: true
        },
        {
            id: 'scanner',
            path: '/scanner',
            aria: 'Link Scanner',
            image: iconScanner,
            color: 'from-blue-500 to-indigo-600',
        },
        {
            id: 'ai',
            path: 'https://glittering-alfajores-8099c1.netlify.app/',
            aria: 'Gemini Interface',
            image: iconAI,
            color: 'from-orange-500 to-amber-600',
            external: true
        },
    ];

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="fixed top-0 right-0 z-50 p-6 flex justify-end items-center gap-4 pointer-events-none">
            <div className="pointer-events-auto relative" ref={menuRef}>

                {/* App Launcher Button */}
                <motion.button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 backdrop-blur-xl border ${isOpen
                        ? 'bg-white/20 border-white/30'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                        }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        boxShadow: isOpen
                            ? '0 0 30px rgba(255,255,255,0.1), inset 0 0 20px rgba(255,255,255,0.05)'
                            : '0 10px 40px rgba(0,0,0,0.3)'
                    }}
                    aria-label="App Launcher"
                >
                    <motion.div
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white/80">
                            <circle cx="5" cy="5" r="2.5" />
                            <circle cx="12" cy="5" r="2.5" />
                            <circle cx="19" cy="5" r="2.5" />
                            <circle cx="5" cy="12" r="2.5" />
                            <circle cx="12" cy="12" r="2.5" />
                            <circle cx="19" cy="12" r="2.5" />
                            <circle cx="5" cy="19" r="2.5" />
                            <circle cx="12" cy="19" r="2.5" />
                            <circle cx="19" cy="19" r="2.5" />
                        </svg>
                    </motion.div>
                </motion.button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute top-16 right-0 w-[340px] rounded-3xl overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, rgba(30,30,40,0.95) 0%, rgba(20,20,30,0.98) 100%)',
                                boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
                                backdropFilter: 'blur(40px)',
                            }}
                        >
                            {/* Ambient glow */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
                                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl" />
                            </div>

                            {/* Header */}
                            <div className="relative z-10 px-6 pt-5 pb-4 border-b border-white/5">
                                <h3 className="text-xs font-bold tracking-widest uppercase text-white/40">Applications</h3>
                            </div>

                            {/* App Grid */}
                            <div className="relative z-10 p-4 grid grid-cols-3 gap-3">
                                {apps.map((app, index) => (
                                    app.external ? (
                                        <motion.a
                                            key={app.id}
                                            href={app.path}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => setIsOpen(false)}
                                            className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all group relative"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05, duration: 0.3 }}
                                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                            whileTap={{ scale: 0.95 }}
                                            title={app.aria}
                                        >
                                            <div
                                                className="w-14 h-14 rounded-2xl overflow-hidden transition-all duration-300 relative"
                                                style={{
                                                    boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                                                }}
                                            >
                                                <img
                                                    src={app.image}
                                                    alt={app.aria}
                                                    className="w-full h-full object-cover"
                                                />
                                                {/* Hover glow */}
                                                <div className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-0 group-hover:opacity-30 transition-opacity mix-blend-overlay`} />
                                            </div>
                                            <span className="text-[10px] text-white/50 group-hover:text-white/80 transition-colors font-medium">External</span>
                                        </motion.a>
                                    ) : (
                                        <motion.div
                                            key={app.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05, duration: 0.3 }}
                                        >
                                            <Link
                                                to={app.path}
                                                onClick={() => setIsOpen(false)}
                                                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all group relative ${isActive(app.path) ? 'bg-white/10' : ''
                                                    }`}
                                                title={app.aria}
                                            >
                                                {/* Active indicator */}
                                                {isActive(app.path) && (
                                                    <motion.div
                                                        className="absolute -bottom-1 left-1/2 w-1 h-1 rounded-full bg-white"
                                                        layoutId="activeIndicator"
                                                    />
                                                )}

                                                <motion.div
                                                    className="w-14 h-14 rounded-2xl overflow-hidden transition-all duration-300 relative"
                                                    style={{
                                                        boxShadow: isActive(app.path)
                                                            ? '0 0 30px rgba(168, 85, 247, 0.4), 0 10px 30px rgba(0,0,0,0.4)'
                                                            : '0 10px 30px rgba(0,0,0,0.4)',
                                                    }}
                                                    whileHover={{
                                                        scale: 1.1,
                                                        rotate: 5,
                                                        boxShadow: '0 0 40px rgba(168, 85, 247, 0.3), 0 20px 40px rgba(0,0,0,0.5)'
                                                    }}
                                                >
                                                    <img
                                                        src={app.image}
                                                        alt={app.aria}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {/* Shine effect */}
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                    {/* Hover glow */}
                                                    <div className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-0 group-hover:opacity-30 transition-opacity mix-blend-overlay`} />
                                                </motion.div>

                                                {/* Experimental badge */}
                                                {app.experimental && (
                                                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-amber-500/80 text-[8px] font-bold text-black rounded-md">
                                                        BETA
                                                    </span>
                                                )}
                                            </Link>
                                        </motion.div>
                                    )
                                ))}

                                {/* Placeholder */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 0.3, y: 0 }}
                                    transition={{ delay: apps.length * 0.05, duration: 0.3 }}
                                    className="flex flex-col items-center gap-2 p-3 cursor-not-allowed"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border-2 border-dashed border-white/10">
                                        <span className="text-xl text-white/30">+</span>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Footer */}
                            <div className="relative z-10 px-6 py-4 border-t border-white/5 bg-white/5">
                                <p className="text-[10px] text-white/30 text-center tracking-wider">
                                    MAPT ECOSYSTEM v2.0
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* User Account Button */}
            <motion.div
                className="pointer-events-auto"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                <UserButton
                    appearance={{
                        elements: {
                            avatarBox: "w-10 h-10 rounded-xl border-2 border-white/20 hover:border-white/40 transition-all"
                        }
                    }}
                />
            </motion.div>
        </nav>
    );
}
