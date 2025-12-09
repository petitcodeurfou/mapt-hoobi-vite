import { useEffect, useRef } from 'react';
import { GhostTerminal } from './components/GhostTerminal';

function App() {
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
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black overflow-hidden">

      {/* Ambient Light */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="liquid-orb w-[800px] h-[800px] bg-blue-900/20 top-[-20%] left-[-10%]" />
        <div className="liquid-orb w-[600px] h-[600px] bg-purple-900/20 bottom-[-10%] right-[-10%] animation-delay-2000" />
      </div>

      {/* Navigation */}
      <nav className="fixed w-full z-50 px-8 py-6 flex justify-between items-center mix-blend-difference">
        <div className="font-display text-2xl font-bold tracking-widest">MAPT</div>
        <div className="hidden md:flex gap-12 text-xs font-bold tracking-[0.2em] uppercase">
          {['Projets', 'Agence', 'Contact'].map((item) => (
            <a key={item} href="#" className="relative group overflow-hidden">
              <span className="block transition-transform duration-300 group-hover:-translate-y-full">{item}</span>
              <span className="absolute top-0 left-0 block translate-y-full transition-transform duration-300 group-hover:translate-y-0 text-gray-400">{item}</span>
            </a>
          ))}
        </div>
        <div className="w-8 h-8 flex flex-col justify-center gap-1.5 items-end cursor-pointer group">
          <div className="w-8 h-[2px] bg-white transition-all group-hover:w-6" />
          <div className="w-4 h-[2px] bg-white transition-all group-hover:w-8" />
        </div>
      </nav>

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

      {/* Horizontal Scroll / Showcase Section */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 border-b border-white/10 pb-8">
            <h2 className="font-display text-4xl font-bold">NOS CRÉATIONS</h2>
            <span className="text-xs tracking-widest text-gray-500">(2024 — 2025)</span>
          </div>

          <div className="w-full">
            <GhostTerminal />
          </div>
        </div>
      </section>

      {/* Manifesto Section */}
      <section className="relative py-40 px-6 bg-white text-black">
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
      <footer className="relative py-20 px-6 bg-[#050505] border-t border-white/10">
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

export default App;
