import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

// ============================================
// ULTRA PREMIUM PARTICLE SYSTEM
// ============================================

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    speedY: number;
    speedX: number;
    opacity: number;
    color: string;
}

const ParticleField = ({ count = 100 }: { count?: number }) => {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        const colors = ['#a855f7', '#06b6d4', '#ec4899', '#8b5cf6', '#14b8a6'];
        const newParticles: Particle[] = [];

        for (let i = 0; i < count; i++) {
            newParticles.push({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: 1 + Math.random() * 3,
                speedY: 0.02 + Math.random() * 0.05,
                speedX: (Math.random() - 0.5) * 0.02,
                opacity: 0.3 + Math.random() * 0.7,
                color: colors[Math.floor(Math.random() * colors.length)],
            });
        }
        setParticles(newParticles);
    }, [count]);

    useEffect(() => {
        let animationId: number;

        const animate = () => {
            setParticles(prev => prev.map(p => ({
                ...p,
                y: p.y - p.speedY > -5 ? p.y - p.speedY : 105,
                x: p.x + p.speedX,
            })));
            animationId = requestAnimationFrame(animate);
        };

        animationId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationId);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        opacity: p.opacity,
                        boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                    }}
                />
            ))}
        </div>
    );
};

// ============================================
// 3D TILT CARD COMPONENT
// ============================================

const TiltCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const xSpring = useSpring(x, { stiffness: 150, damping: 15 });
    const ySpring = useSpring(y, { stiffness: 150, damping: 15 });

    const rotateX = useTransform(ySpring, [-0.5, 0.5], [15, -15]);
    const rotateY = useTransform(xSpring, [-0.5, 0.5], [-15, 15]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const xPos = (e.clientX - rect.left) / rect.width - 0.5;
        const yPos = (e.clientY - rect.top) / rect.height - 0.5;
        x.set(xPos);
        y.set(yPos);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            className={`perspective-1000 ${className}`}
        >
            {children}
        </motion.div>
    );
};

// ============================================
// HOLOGRAPHIC TEXT
// ============================================

const HolographicText = ({ children, className = '' }: { children: string; className?: string }) => {
    return (
        <span className={`relative inline-block ${className}`}>
            {/* Base text */}
            <span className="relative z-10 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                {children}
            </span>
            {/* Glow layers */}
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent blur-sm opacity-50 animate-gradient bg-[length:200%_auto]">
                {children}
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent blur-lg opacity-30 animate-gradient bg-[length:200%_auto]">
                {children}
            </span>
        </span>
    );
};

// ============================================
// ANIMATED COUNTER
// ============================================

const AnimatedCounter = ({ value, duration = 2 }: { value: string; duration?: number }) => {
    const [displayValue, setDisplayValue] = useState('0');
    const isNumber = !isNaN(Number(value.replace(/[^0-9]/g, '')));

    useEffect(() => {
        if (!isNumber) {
            setDisplayValue(value);
            return;
        }

        const target = parseInt(value.replace(/[^0-9]/g, ''));
        let current = 0;
        const increment = target / (duration * 60);
        const suffix = value.replace(/[0-9]/g, '');

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                setDisplayValue(value);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(current) + suffix);
            }
        }, 1000 / 60);

        return () => clearInterval(timer);
    }, [value, duration, isNumber]);

    return <span>{displayValue}</span>;
};

// ============================================
// MAGNETIC BUTTON
// ============================================

const MagneticButton = ({ children, onClick, className = '' }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}) => {
    const ref = useRef<HTMLButtonElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const xSpring = useSpring(x, { stiffness: 300, damping: 20 });
    const ySpring = useSpring(y, { stiffness: 300, damping: 20 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set((e.clientX - centerX) * 0.3);
        y.set((e.clientY - centerY) * 0.3);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.button
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            style={{ x: xSpring, y: ySpring }}
            className={className}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            {children}
        </motion.button>
    );
};

// ============================================
// SHOOTING STARS
// ============================================

const ShootingStars = () => {
    const stars = useMemo(() =>
        Array.from({ length: 5 }).map((_, i) => ({
            id: i,
            delay: i * 3,
            duration: 1 + Math.random() * 2,
            top: Math.random() * 50,
        })), []
    );

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {stars.map(star => (
                <motion.div
                    key={star.id}
                    className="absolute w-[100px] h-[2px]"
                    style={{
                        top: `${star.top}%`,
                        background: 'linear-gradient(90deg, transparent, white, transparent)',
                    }}
                    initial={{ left: '100%', opacity: 0 }}
                    animate={{
                        left: '-20%',
                        opacity: [0, 1, 1, 0],
                    }}
                    transition={{
                        duration: star.duration,
                        delay: star.delay,
                        repeat: Infinity,
                        repeatDelay: 10 + Math.random() * 5,
                        ease: 'linear',
                    }}
                />
            ))}
        </div>
    );
};

// ============================================
// FLOATING GEOMETRIC SHAPES
// ============================================

const FloatingShapes = () => {
    const shapes = [
        { type: 'ring', size: 200, top: '10%', left: '10%', delay: 0 },
        { type: 'ring', size: 150, top: '60%', right: '15%', delay: 2 },
        { type: 'triangle', size: 100, top: '30%', right: '25%', delay: 4 },
        { type: 'square', size: 80, bottom: '20%', left: '20%', delay: 6 },
    ];

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {shapes.map((shape, i) => (
                <motion.div
                    key={i}
                    className="absolute"
                    style={{
                        top: shape.top,
                        left: shape.left,
                        right: shape.right,
                        bottom: shape.bottom,
                    }}
                    animate={{
                        y: [0, -30, 0],
                        rotate: [0, 180, 360],
                        opacity: [0.1, 0.2, 0.1],
                    }}
                    transition={{
                        duration: 20,
                        delay: shape.delay,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                >
                    {shape.type === 'ring' && (
                        <div
                            className="rounded-full border border-white/10"
                            style={{ width: shape.size, height: shape.size }}
                        />
                    )}
                    {shape.type === 'triangle' && (
                        <div
                            className="border-l-[50px] border-r-[50px] border-b-[86px] border-l-transparent border-r-transparent border-b-white/10"
                        />
                    )}
                    {shape.type === 'square' && (
                        <div
                            className="border border-white/10 rotate-45"
                            style={{ width: shape.size, height: shape.size }}
                        />
                    )}
                </motion.div>
            ))}
        </div>
    );
};

// ============================================
// MAIN HOME COMPONENT
// ============================================

export function Home() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const heroRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth) * 100,
                y: (e.clientY / window.innerHeight) * 100
            });

            if (heroRef.current) {
                const x = (window.innerWidth / 2 - e.clientX) / 30;
                const y = (window.innerHeight / 2 - e.clientY) / 30;
                heroRef.current.style.transform = `translate(${x}px, ${y}px)`;
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="min-h-screen bg-[#030014] text-white selection:bg-purple-500/30 overflow-hidden relative">

            {/* Gradient animation keyframes */}
            <style>{`
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-gradient {
                    animation: gradient 3s ease infinite;
                }
            `}</style>

            {/* Particle field - 100 particles */}
            <ParticleField count={100} />

            {/* Shooting stars */}
            <ShootingStars />

            {/* Floating geometric shapes */}
            <FloatingShapes />

            {/* Dynamic cursor spotlight */}
            <div
                className="fixed w-[800px] h-[800px] rounded-full pointer-events-none z-0 transition-all duration-200"
                style={{
                    background: `radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.05) 40%, transparent 70%)`,
                    left: `${mousePosition.x}%`,
                    top: `${mousePosition.y}%`,
                    transform: 'translate(-50%, -50%)',
                }}
            />

            {/* Ambient orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute w-[1000px] h-[1000px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 60%)',
                        top: '-30%',
                        left: '-20%',
                    }}
                    animate={{
                        x: [0, 100, 0],
                        y: [0, 50, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute w-[800px] h-[800px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 60%)',
                        bottom: '-20%',
                        right: '-20%',
                    }}
                    animate={{
                        x: [0, -80, 0],
                        y: [0, -40, 0],
                        scale: [1, 1.3, 1],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute w-[600px] h-[600px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 60%)',
                        top: '40%',
                        right: '10%',
                    }}
                    animate={{
                        x: [0, -50, 50, 0],
                        y: [0, 30, -30, 0],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Grid overlay */}
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.02]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
                    `,
                    backgroundSize: '80px 80px',
                }}
            />

            {/* Noise texture */}
            <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 pointer-events-none" />

            {/* Hero Section */}
            <section className="relative min-h-screen flex flex-col justify-center items-center z-10 px-6">
                <div ref={heroRef} className="text-center relative max-w-5xl mx-auto pointer-events-auto">

                    {/* Decorative rotating rings */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <motion.div
                            className="w-[700px] h-[700px] border border-purple-500/10 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                        />
                        <motion.div
                            className="w-[550px] h-[550px] border border-cyan-500/10 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                            animate={{ rotate: -360 }}
                            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                        />
                        <motion.div
                            className="w-[400px] h-[400px] border border-pink-500/10 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        />
                    </div>

                    {/* Status badge */}
                    <motion.div
                        className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl mb-10"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <motion.span
                            className="w-2.5 h-2.5 rounded-full bg-green-500"
                            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <span className="text-sm font-medium tracking-wider text-white/60">SYSTÈME OPÉRATIONNEL</span>
                    </motion.div>

                    {/* Main title with holographic effect */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                    >
                        <h1 className="font-display text-8xl md:text-[10rem] font-black tracking-tighter mb-8 leading-none">
                            <motion.div
                                className="overflow-hidden"
                                initial={{ y: 100 }}
                                animate={{ y: 0 }}
                                transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.1)' }}>AU-DELÀ</span>
                            </motion.div>
                            <motion.div
                                className="overflow-hidden"
                                initial={{ y: 100 }}
                                animate={{ y: 0 }}
                                transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <span className="block text-white">
                                    DU RÉEL
                                </span>
                            </motion.div>
                        </h1>
                    </motion.div>

                    {/* Subtitle */}
                    <motion.p
                        className="text-white/40 max-w-xl mx-auto text-lg md:text-xl font-light tracking-wide leading-relaxed mb-14"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                    >
                        Mapt crée des expériences numériques qui défient les lois de la physique.
                        <span className="text-purple-400 font-medium"> Nous construisons l'impossible.</span>
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        className="flex flex-col sm:flex-row gap-5 justify-center items-center"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                    >
                        <TiltCard>
                            <MagneticButton
                                className="group relative px-10 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-2xl font-bold text-lg overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-3">
                                    Explorer
                                    <motion.svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        animate={{ x: [0, 5, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </motion.svg>
                                </span>
                                {/* Animated shine */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                                    animate={{ x: ['-200%', '200%'] }}
                                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                                />
                            </MagneticButton>
                        </TiltCard>

                        <MagneticButton
                            className="px-10 py-5 border border-white/20 rounded-2xl font-medium text-lg text-white/80 hover:bg-white/5 hover:border-white/40 transition-all backdrop-blur-sm"
                        >
                            En savoir plus
                        </MagneticButton>
                    </motion.div>

                    {/* Scroll indicator */}
                    <motion.div
                        className="absolute -bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                    >
                        <motion.div
                            className="w-7 h-12 rounded-full border-2 border-white/20 flex items-start justify-center p-2"
                            animate={{ y: [0, 5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <motion.div
                                className="w-1.5 h-3 rounded-full bg-gradient-to-b from-purple-500 to-pink-500"
                                animate={{ y: [0, 10, 0], opacity: [1, 0.3, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </motion.div>
                        <span className="text-[10px] tracking-[0.4em] uppercase text-white/30">Défiler</span>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="relative py-40 px-6 z-10">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        className="grid grid-cols-2 md:grid-cols-4 gap-6"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        {[
                            { value: '∞', label: 'Possibilités', color: 'from-purple-500 to-pink-500' },
                            { value: '24/7', label: 'Disponible', color: 'from-cyan-500 to-blue-500' },
                            { value: '100%', label: 'Sécurisé', color: 'from-green-500 to-emerald-500' },
                            { value: '0', label: 'Compromis', color: 'from-orange-500 to-red-500' },
                        ].map((stat, i) => (
                            <TiltCard key={i}>
                                <motion.div
                                    className="relative p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl overflow-hidden group"
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    viewport={{ once: true }}
                                    whileHover={{ borderColor: 'rgba(168, 85, 247, 0.3)' }}
                                >
                                    {/* Hover glow */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                                    <div className={`text-5xl md:text-6xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-3`}>
                                        <AnimatedCounter value={stat.value} />
                                    </div>
                                    <div className="text-white/40 text-sm tracking-widest uppercase">{stat.label}</div>
                                </motion.div>
                            </TiltCard>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Manifesto Section */}
            <section className="relative py-40 px-6 z-10">
                <div className="max-w-5xl mx-auto">
                    <TiltCard>
                        <motion.div
                            className="relative p-16 md:p-24 rounded-[3rem] bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-2xl overflow-hidden"
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                        >
                            {/* Decorative gradients */}
                            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-cyan-500/20 to-transparent rounded-full blur-3xl" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/4 h-1/4 bg-gradient-to-r from-pink-500/15 to-purple-500/15 rounded-full blur-3xl" />

                            <motion.p
                                className="relative font-display text-4xl md:text-6xl font-bold leading-tight"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                "Nous croyons en une technologie qui ressemble à de la{' '}
                                <HolographicText>magie</HolographicText>.
                                Invisible, puissante et absolument essentielle."
                            </motion.p>

                            <motion.div
                                className="relative mt-12 flex items-center gap-4"
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                viewport={{ once: true }}
                            >
                                <div className="w-16 h-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-transparent" />
                                <span className="text-sm font-bold tracking-widest uppercase text-white/50">La Philosophie Mapt</span>
                            </motion.div>
                        </motion.div>
                    </TiltCard>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative py-24 px-6 border-t border-white/5 z-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <motion.div
                        className="font-display text-7xl md:text-9xl font-black tracking-tighter select-none cursor-default"
                        whileHover={{ scale: 1.05 }}
                    >
                        <HolographicText>MAPT</HolographicText>
                    </motion.div>
                    <div className="flex gap-10">
                        {['Instagram', 'Twitter', 'Discord'].map((social) => (
                            <motion.a
                                key={social}
                                href="#"
                                className="text-sm uppercase tracking-widest text-white/30 hover:text-white transition-colors relative group"
                                whileHover={{ y: -3 }}
                            >
                                {social}
                                <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 group-hover:w-full transition-all duration-300" />
                            </motion.a>
                        ))}
                    </div>
                </div>
            </footer>

            {/* Copy right */}
            <div className="relative z-10 text-center pb-8">
                <p className="text-white/20 text-xs tracking-widest">© 2024 MAPT • BEYOND REALITY</p>
            </div>
        </div>
    );
}
