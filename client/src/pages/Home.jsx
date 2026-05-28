import React, { Suspense, useRef, useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { Send, ArrowRight, Zap, Lock, Check, ShieldCheck } from 'lucide-react';
import { IconBrandX, IconBrandGithub } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';

function ParticleGlobe() {
  const ref = useRef();
  const particles = useMemo(() => {
    const temp = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000; i++) {
      const stride = i * 3;
      const phi = Math.acos(-1 + (2 * i) / 3000);
      const theta = Math.sqrt(3000 * Math.PI) * phi;
      temp[stride] = Math.cos(theta) * Math.sin(phi) * 1.5;
      temp[stride + 1] = Math.sin(theta) * Math.sin(phi) * 1.5;
      temp[stride + 2] = Math.cos(phi) * 1.5;
    }
    return temp;
  }, []);

  useFrame((state, delta) => {
    ref.current.rotation.y += delta * 0.05;
    ref.current.rotation.x += delta * 0.02;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]} position={[0, 1, 0]}>
      <Points ref={ref} positions={particles} stride={3} frustumCulled={false}>
        <PointMaterial transparent color="#2563eb" size={0.015} sizeAttenuation={true} depthWrite={false} blending={THREE.AdditiveBlending} />
      </Points>
    </group>
  );
}

const CipherText = ({ text }) => {
  const [display, setDisplay] = useState(text.replace(/./g, '0'));
  useEffect(() => {
    let iteration = 0;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*XCH";
    const interval = setInterval(() => {
      setDisplay(text.split("").map((letter, index) => {
        if(index < iteration) return text[index];
        return chars[Math.floor(Math.random() * chars.length)];
      }).join(""));
      if(iteration >= text.length) clearInterval(interval);
      iteration += 1 / 3;
    }, 40);
    return () => clearInterval(interval);
  }, [text]);
  return <span className="font-mono text-white/90">{display}</span>;
}

const Home = () => {
  const [activeTab, setActiveTab] = useState('vortex');

  const tabData = {
    vortex: {
      title: 'Vórtices de Datos Efímeros',
      description: 'Envía archivos o texto que se autodestruyen físicamente tras la lectura. Sin metadatos, sin persistencia en disco. Privacidad total por diseño.',
      icon: <ShieldCheck className="text-blue-500" />
    },
    seguridad: {
      title: 'Protocolo xChaCha20-Poly1305',
      description: 'Implementamos el estándar de cifrado más avanzado y veloz. Tus secretos se blindan en tu navegador antes de ser lanzados a la red.',
      icon: <ShieldCheck className="text-emerald-500" />
    },
    zero: {
      title: 'Arquitectura Zero-Knowledge',
      description: 'Nosotros no tenemos llaves maestras. El cifrado ocurre en el lado del cliente. Ni siquiera Zyphro puede acceder a lo que envías.',
      icon: <Lock className="text-rose-500" />
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden font-sans relative selection:bg-blue-500/30">
      <div className="absolute inset-0 z-0 opacity-20">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
          <Suspense fallback={null}><ParticleGlobe /></Suspense>
        </Canvas>
      </div>

      <nav className="max-w-7xl mx-auto px-6 h-24 flex justify-between items-center relative z-[100]">
        <Link to="/" className="flex items-center">
          <span className="text-3xl font-black italic tracking-tighter text-blue-600 uppercase">ZYPHRO</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-10">
          <Link to="/" className="text-[10px] font-black tracking-widest uppercase text-white border-b-2 border-blue-600 pb-1">Inicio</Link>
          <a href="#tecnologia" className="text-[10px] font-black tracking-widest uppercase text-slate-400 hover:text-white transition-colors">Tecnología</a>
        </div>

        <Link to="/drop" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-[10px] tracking-widest uppercase hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95">Iniciar Vórtice</Link>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32 relative z-10 flex flex-col items-center text-center">
        
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="mb-40 flex flex-col items-center">
          <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full mb-10 text-blue-500">
            <Zap size={14} className="animate-pulse" /> <span className="text-[10px] font-black tracking-[0.3em] uppercase italic">Vortex Engine Online</span>
          </div>
          <h1 className="text-7xl md:text-8xl lg:text-[8.5rem] font-black tracking-tighter mb-8 leading-[0.8] max-w-5xl uppercase italic">
            Invisible. <br /> <span className="text-blue-600">Efímero.</span> Blindado.
          </h1>
          <p className="max-w-2xl text-slate-400 text-lg lg:text-xl font-medium mb-12 leading-relaxed">
            La herramienta definitiva para el transporte de secretos. <br/>
            Cifrado Zero-Knowledge <span className="font-mono text-blue-400 bg-white/5 px-2 py-1 rounded-lg"><CipherText text="xChaCha20-Poly1305" /></span>
          </p>
          <Link to="/drop" className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 rounded-2xl font-black text-xs tracking-[0.2em] uppercase transition-all shadow-2xl shadow-blue-600/30 flex items-center gap-3 active:scale-95">
            <Send size={20} /> Crear Vórtice Gratis
          </Link>
        </motion.div>

        <div id="tecnologia" className="w-full max-w-6xl mb-40 text-left bg-slate-950/80 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,2fr] gap-12 items-center">
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-black text-blue-500 tracking-[0.3em] uppercase mb-4 italic">Protocolos de Bóveda</h2>
              {Object.keys(tabData).map((key) => (
                <button key={key} onClick={() => setActiveTab(key)} className={`flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 ${activeTab === key ? 'bg-blue-600/10 border-blue-500/50 shadow-lg' : 'bg-white/5 border-white/5 hover:border-white/10'}`}>
                  <div className={`p-2 rounded-lg ${activeTab === key ? 'bg-blue-600/20' : 'bg-slate-800'}`}>{tabData[key].icon}</div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${activeTab === key ? 'text-white' : 'text-slate-400'}`}>
                    {key === 'vortex' ? 'Cápsulas de Datos' : key === 'seguridad' ? 'Seguridad Militar' : 'Soberanía Digital'}
                  </span>
                </button>
              ))}
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-10 min-h-[300px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }}>
                  <h3 className="text-3xl font-black italic tracking-tight text-white mb-5 uppercase leading-tight">{tabData[activeTab].title}</h3>
                  <p className="text-slate-300 text-base font-medium leading-relaxed max-w-2xl">{tabData[activeTab].description}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="w-full max-w-4xl bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/30 rounded-3xl p-12 backdrop-blur-xl text-center">
          <h2 className="text-4xl font-black mb-4 uppercase italic">100% Público y Gratuito</h2>
          <p className="text-slate-300 text-lg font-medium mb-8">
            Zyphro es una herramienta pura de cifrado efímero. Sin registro, sin límites artificiales, sin monetización.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Lock size={24} />, title: 'Sin Registro', desc: 'Usa directamente sin crear cuenta' },
              { icon: <Zap size={24} />, title: 'Instantáneo', desc: 'Cifra y comparte en segundos' },
              { icon: <ShieldCheck size={24} />, title: 'Seguro', desc: 'xChaCha20-Poly1305 verificado' }
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="text-blue-400 mb-3">{item.icon}</div>
                <h4 className="font-black text-white mb-2">{item.title}</h4>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-black/90 border-t border-white/5 py-20 relative z-10 text-left">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1">
            <span className="text-2xl font-black italic text-blue-600 uppercase">ZYPHRO</span>
            <p className="text-slate-500 text-xs font-bold mt-4 leading-relaxed max-w-[200px]">
              Herramienta de cifrado efímero. Zero-Knowledge by design.
            </p>
          </div>
          <div>
            <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-6 italic">Sistema</h5>
            <ul className="space-y-4 text-xs font-bold text-slate-400">
              <li>Vortex Engine</li>
              <li>Protocolo Abierto</li>
            </ul>
          </div>
          <div>
            <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-6 italic">Legal</h5>
            <ul className="space-y-4 text-xs font-bold text-slate-400">
              <li>Privacidad</li>
              <li>Términos</li>
            </ul>
          </div>
          <div className="flex gap-6 items-start">
             <IconBrandX className="text-slate-600 hover:text-white transition-colors cursor-pointer" size={20} />
             <IconBrandGithub className="text-slate-600 hover:text-white transition-colors cursor-pointer" size={20} />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-white/5 text-[8px] font-black text-slate-600 tracking-[0.4em] uppercase">
          © 2026 ZYPHRO. OPEN SOURCE. ZERO-KNOWLEDGE.
        </div>
      </footer>
    </div>
  );
};

export default Home;