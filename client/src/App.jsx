import { Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from "@vercel/analytics/react";
import Home from './pages/Home';
import Drop from './pages/Drop'; 
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-blue-500/30">
      <Toaster position="bottom-right" />
      <Analytics />
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/drop" element={<Drop />} /> 

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;