import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Cloud, ShieldCheck } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="relative bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 z-[100]">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center group">
          <span 
            style={{ 
              display: 'inline-block',
              fontSize: '1.5rem', 
              fontWeight: '900', 
              fontStyle: 'italic', 
              letterSpacing: '-0.05em', 
              textTransform: 'uppercase',
              color: '#2563eb', 
              paddingRight: '0.4em', 
              lineHeight: '1.2'
            }}
          >
            ZYPHRO
          </span>
        </Link>

        {/* ENLACES CENTRO (Desktop) */}
        <div className="hidden md:flex items-center gap-10 h-full">
          <Link to="/" className="text-[10px] font-black tracking-widest uppercase text-slate-400 hover:text-white transition-colors">
            Home
          </Link>
          <Link to="/drop" className="text-[10px] font-black tracking-widest uppercase text-slate-400 hover:text-white transition-colors flex items-center gap-2">
            <Cloud size={12} /> Secure Drop
          </Link>
        </div>

        {/* BOTONES DERECHA */}
        <div className="hidden md:flex items-center gap-6">
          <div className="text-[9px] font-black text-blue-400 tracking-widest uppercase flex items-center gap-2">
            <ShieldCheck size={12} /> xChaCha20-Poly1305
          </div>
        </div>

        {/* MENÚ MÓVIL */}
        <button 
          className="md:hidden p-2 text-slate-400 hover:text-white transition-colors" 
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Menú Móvil */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#020617] border-b border-white/5 shadow-2xl p-6 flex flex-col gap-4 z-[100] animate-in slide-in-from-top-5">
            <Link to="/" className="text-slate-400 font-black text-[10px] uppercase tracking-widest p-3 hover:bg-white/5 rounded-xl" onClick={() => setIsOpen(false)}>Home</Link>
            <Link to="/drop" className="text-slate-400 font-black text-[10px] uppercase tracking-widest p-3 hover:bg-white/5 rounded-xl flex items-center gap-2" onClick={() => setIsOpen(false)}><Cloud size={12} /> Secure Drop</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;