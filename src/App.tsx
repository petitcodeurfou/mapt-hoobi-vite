import { Routes, Route, useLocation } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { GhostTerminal } from './components/GhostTerminal';
import { Vault } from './components/Vault';
import { Messages } from './components/Messages';
import { LinkScanner } from './components/LinkScanner';
import { Home } from './pages/Home';
import { AnimatePresence } from 'framer-motion';

function App() {
  const location = useLocation();

  return (
    <>
      <Navigation />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/ghost" element={<GhostTerminal />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/scanner" element={<LinkScanner />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;
