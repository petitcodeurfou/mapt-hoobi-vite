import { useEffect, useRef } from 'react';

export function Home() {
    const heroRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // Parallax effect for hero
            if (heroRef.current) {
                const x = (window.innerWidth - e.clientX * 2) / 100;
                const y = (window.innerHeight - e.clientY * 2) / 100;
                heroRef.current.style.transform = `translateX(${x}px) translateY(${y}px)`;
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black overflow-hidden relative">

            {/* Ambient Light */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="liquid-orb w-[800px] h-[800px] bg-blue-900/20 top-[-20%] left-[-10%]" />
                <div className="liquid-orb w-[600px] h-[600px] bg-purple-900/20 bottom-[-10%] right-[-10%] animation-delay-2000" />
            </div>

            {/* Hero Section */}
            <section className="relative h-screen flex flex-col justify-center items-center z-10 perspective-container">
                <div ref={heroRef} className="text-center relative">
                    <div className="font-display text-[12vw] leading-[0.8] font-bold tracking-tighter mix-blend-overlay opacity-50 select-none pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap">
                        FUTUR
                    </div>

                    <h1 className="font-display text-6xl md:text-8xl font-bold tracking-tighter mb-8 relative z-10">
                        <span className="block glitch-wrapper">
                            <span className="glitch" data-text="AU-DELÀ">AU-DELÀ</span>
                        </span>
                        <span className="block text-chrome">DU RÉEL</span>
                    </h1>

                    <p className="text-gray-400 max-w-md mx-auto text-sm md:text-base font-light tracking-wide leading-relaxed mb-12">
                        Mapt crée des expériences numériques qui défient les lois de la physique.
                        Nous construisons l'impossible pour les visionnaires.
                    </p>

                    <div className="flex flex-col items-center gap-4">
                        <div className="w-[1px] h-24 bg-gradient-to-b from-transparent via-white to-transparent animate-pulse" />
                        <span className="text-[10px] tracking-[0.3em] uppercase opacity-50">Défiler pour explorer</span>
                    </div>
                </div>
            </section>

            {/* Manifesto Section */}
            <section className="relative py-40 px-6 bg-white text-black z-10">
                <div className="max-w-5xl mx-auto">
                    <p className="font-display text-4xl md:text-6xl font-bold leading-tight">
                        "NOUS CROYONS EN UNE TECHNOLOGIE QUI RESSEMBLE À DE LA <span className="italic text-blue-600">MAGIE</span>.
                        INVISIBLE, PUISSANTE ET ABSOLUMENT ESSENTIELLE."
                    </p>
                    <div className="mt-12 flex items-center gap-4">
                        <div className="w-12 h-[1px] bg-black" />
                        <span className="text-sm font-bold tracking-widest uppercase">La Philosophie Mapt</span>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative py-20 px-6 bg-[#050505] border-t border-white/10 z-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
                    <div className="font-display text-[10vw] font-bold leading-none text-[#1a1a1a] select-none hover:text-white transition-colors duration-500">
                        MAPT
                    </div>
                    <div className="flex gap-8 mt-8 md:mt-0">
                        <a href="#" className="text-sm uppercase tracking-widest hover:underline">Instagram</a>
                        <a href="#" className="text-sm uppercase tracking-widest hover:underline">Twitter</a>
                        <a href="#" className="text-sm uppercase tracking-widest hover:underline">Email</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
