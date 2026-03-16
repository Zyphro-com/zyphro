import React, { Suspense, useRef, useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { Shield, Send, ArrowRight, Zap, Lock, Globe, ChevronDown, Mail, Skull, Cloud, Check, Sparkles, Star, EyeOff, Server, Activity, Terminal } from 'lucide-react';
import { IconBrandX, IconBrandReddit, IconBrandGithub } from '@tabler/icons-react'; // Necesitas instalar @tabler/icons-react
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from 'framer-motion';

// --- COMPONENTE GLOBO 3D (REDUCIDO Y CORREGIDO) ---
function ParticleGlobe() {
  const ref = useRef();
  const particles = useMemo(() => {
    const temp = new Float32Array(3000 * 3); // Reducido número de partículas
    for (let i = 0; i < 3000; i++) {
      const stride = i * 3;
      const phi = Math.acos(-1 + (2 * i) / 3000);
      const theta = Math.sqrt(3000 * Math.PI) * phi;
      // Radio reducido de 2.5 a 1.8 para hacerlo más pequeño
      temp[stride] = Math.cos(theta) * Math.sin(phi) * 1.5;
      temp[stride + 1] = Math.sin(theta) * Math.sin(phi) * 1.5;
      temp[stride + 2] = Math.cos(phi) * 1.5;
    }
    return temp;
  }, []);

  useFrame((state, delta) => {
    ref.current.rotation.y += delta * 0.05; // Rotación más lenta
    ref.current.rotation.x += delta * 0.02;
  });

  return (
    // Posicionado ligeramente hacia la derecha y arriba para no molestar al Hero
    <group rotation={[0, 0, Math.PI / 4]} position={[0, 1, 0]}>
      <Points ref={ref} positions={particles} stride={3} frustumCulled={false}>
        <PointMaterial transparent color="#2563eb" size={0.015} sizeAttenuation={true} depthWrite={false} blending={THREE.AdditiveBlending} />
      </Points>
    </group>
  );
}

// --- EFECTO DE CIFRADO MATRIX (MEJORADO) ---
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
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAnnual, setIsAnnual] = useState(true);
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('seguridad'); // Estado para la nueva sección de pestañas

  // Configuración de la nueva sección de pestañas (Estilo Internxt)
  const tabData = {
    seguridad: {
      title: 'Seguridad End-to-End de Próxima Generación',
      description: 'Implementamos el protocolo XChaCha20-Poly1305. A diferencia del AES tradicional, nuestro cifrado es más rápido en dispositivos móviles y resistente a ataques modernos. Tus datos se cifran en tu dispositivo antes de tocar nuestros servidores.',
      icon: <Lock className="text-blue-500" />
    },
    zero: {
      title: 'Arquitectura Zero-Knowledge Real',
      description: 'Nosotros no tenemos la llave. Tus contraseñas de cifrado nunca se envían a Zyphro. Ni un juez, ni un hacker, ni siquiera nuestros ingenieros pueden acceder a tus secretos. Eres el único soberano de tu información.',
      icon: <EyeOff className="text-emerald-500" />
    },
    codigo: {
      title: 'Código Abierto y Transparente',
      description: 'La confianza se gana con transparencia. Todo el núcleo de cifrado de Zyphro está auditado y disponible en GitHub. Cualquiera puede verificar cómo protegemos los datos. Sin puertas traseras, sin secretos.',
      icon: <Terminal className="text-rose-500" />
    }
  };

  const handleCheckout = async (priceId) => {
    if (!user) { window.location.href = '/sign-up'; return; }
    setLoading(true);
    try {
      const userEmail = user.primaryEmailAddress?.emailAddress || undefined;
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, userId: user.id, email: userEmail }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error del servidor (${response.status}): ${errorText}`);
      }
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch (error) { 
      console.error("❌ Fallo en el proceso de pago:", error.message); 
      alert("Hubo un error al conectar con la pasarela de pago.");
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden font-sans relative">
      
      {/* FONDO 3D (REDUCIDO Y AJUSTADO) */}
      <div className="absolute inset-0 z-0 opacity-30">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
          <Suspense fallback={null}><ParticleGlobe /></Suspense>
        </Canvas>
      </div>

      {/* NAVBAR */}
      <nav className="max-w-7xl mx-auto px-6 h-24 flex justify-between items-center relative z-[100]">
        <Link to="/" className="flex items-center group">
          <span className="text-3xl font-black italic tracking-tighter text-blue-600 uppercase">ZYPHRO</span>
        </Link>
        <div className="hidden md:flex items-center gap-10">
          <Link to="/" className="text-[10px] font-black tracking-widest uppercase text-white hover:text-blue-500 transition-colors">Home</Link>
          <div className="relative" onMouseEnter={() => setIsServicesOpen(true)} onMouseLeave={() => setIsServicesOpen(false)}>
            <button className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase text-slate-400 hover:text-white transition-all cursor-pointer outline-none">
              Servicios <ChevronDown size={12} className={`transition-transform duration-300 ${isServicesOpen ? 'rotate-180' : ''}`} />
            </button>
            {isServicesOpen && (
              <div className="absolute top-full -left-4 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="w-64 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl">
                  <Link to="/drop" className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all group">
                    <div className="bg-blue-600/20 p-2 rounded-lg text-blue-500"><Cloud size={16} /></div>
                    <div><p className="text-[10px] font-black uppercase tracking-widest text-white">Secure Drop</p><p className="text-[9px] text-slate-500 font-bold italic">Vórtice efímero</p></div>
                  </Link>
                  <Link to="/dashboard" className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all mt-1">
                    <div className="bg-rose-600/20 p-2 rounded-lg text-rose-500"><Skull size={16} /></div>
                    <div><p className="text-[10px] font-black uppercase tracking-widest text-white">Dead Man Switch</p><p className="text-[9px] text-slate-500 font-bold italic">Herencia digital</p></div>
                  </Link>
                </div>
              </div>
            )}
          </div>
          <Link to="/contact" className="text-[10px] font-black tracking-widest uppercase text-slate-400 hover:text-white transition-colors">Contact Us</Link>
        </div>
        <div className="flex items-center gap-4">
          <SignedOut>
            <Link to="/sign-in" className="text-[10px] font-black tracking-widest uppercase text-slate-400 hover:text-white transition-all px-4">Login</Link>
            <Link to="/sign-up" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-[10px] tracking-widest uppercase hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95">Get Started</Link>
          </SignedOut>
          <SignedIn>
            <Link to="/dashboard" className="text-[10px] font-black tracking-widest uppercase text-slate-400 hover:text-white transition-all px-4">Dashboard</Link>
            <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-9 h-9 border border-blue-500/50 shadow-lg shadow-blue-500/10" } }} />
          </SignedIn>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32 relative z-10 flex flex-col items-center text-center">
        
        {/* HERO SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-40 flex flex-col items-center"
        >
          <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full mb-10 text-blue-500">
            <Shield size={14} /> <span className="text-[10px] font-black tracking-[0.3em] uppercase italic">Vortex Infrastructure v2.5</span>
          </div>
          <h1 className="text-7xl md:text-8xl lg:text-[8.5rem] font-black tracking-tighter mb-8 leading-[0.8] max-w-5xl">
            Internet más <br /> <span className="text-blue-600 italic">ético y privado.</span>
          </h1>
          <p className="max-w-2xl text-slate-400 text-lg lg:text-xl font-medium mb-12 leading-relaxed">
            La alternativa europea blindada para el transporte de secretos. <br/>
            Seguridad de grado militar <span className="font-mono text-blue-400 bg-white/5 px-2 py-1 rounded-lg"><CipherText text="XChaCha20-Poly1305" /></span>
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/drop" className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 rounded-2xl font-black text-xs tracking-[0.2em] uppercase transition-all shadow-2xl shadow-blue-600/30 flex items-center gap-3 active:scale-95">
              <Send size={20} /> Iniciar Vórtice
            </Link>
            <button className="bg-white/5 backdrop-blur-lg border border-white/10 text-white px-12 py-6 rounded-2xl font-black text-xs tracking-[0.2em] uppercase hover:bg-white/10 transition-all flex items-center gap-3">
              Explorar Tecnología <ArrowRight size={20} />
            </button>
          </div>
        </motion.div>

        {/* --- NUEVA SECCIÓN: PESTAÑAS ESTILO INTERNXT --- */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-6xl mb-40 text-left bg-slate-950/80 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl shadow-2xl shadow-black/50"
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,2fr] gap-12 items-center">
            
            {/* Columna Izquierda: Botones de Pestaña */}
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-black text-blue-500 tracking-[0.3em] uppercase mb-4">Cifrado de Próxima Generación</h2>
              <p className="text-4xl font-black italic tracking-tighter uppercase text-white mb-8 leading-tight">Protección Definitiva</p>
              
              {Object.keys(tabData).map((key) => (
                <button 
                  key={key} 
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 ${activeTab === key ? 'bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-500/10' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                >
                  <div className={`p-2 rounded-lg ${activeTab === key ? 'bg-blue-600/20' : 'bg-slate-800'}`}>
                    {tabData[key].icon}
                  </div>
                  <span className={`text-xs font-black uppercase tracking-widest ${activeTab === key ? 'text-white' : 'text-slate-400'}`}>
                    {key === 'seguridad' ? 'Seguridad End-to-End' : key === 'zero' ? 'Zero-Knowledge' : 'Código Abierto'}
                  </span>
                </button>
              ))}
            </div>

            {/* Columna Derecha: Contenido Animado */}
            <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-10 min-h-[300px] flex flex-col justify-center relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="bg-blue-600/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border border-blue-500/30 shadow-lg shadow-blue-500/10">
                      {tabData[activeTab].icon}
                    </div>
                    <h3 className="text-3xl font-black italic tracking-tight text-white mb-5 uppercase leading-tight">{tabData[activeTab].title}</h3>
                    <p className="text-slate-300 text-base font-medium leading-relaxed max-w-2xl">
                      {tabData[activeTab].description}
                    </p>
                  </motion.div>
                </AnimatePresence>
                <div className="absolute -right-20 -bottom-20 bg-blue-600/10 blur-[100px] w-64 h-64 rounded-full z-0 pointer-events-none"></div>
            </div>
          </div>
        </motion.div>

        {/* --- PRICING SECTION --- */}
<motion.div 
  initial={{ opacity: 0 }}
  whileInView={{ opacity: 1 }}
  viewport={{ once: true }}
  className="w-full max-w-7xl mb-40 relative"
>
  <div className="flex flex-col items-center mb-16">
    <h2 className="text-sm font-black text-slate-500 tracking-[0.3em] uppercase mb-4 italic">Infraestructura de Costes</h2>
    <div className="bg-white/5 p-1 rounded-2xl border border-white/10 flex items-center relative mb-4">
      <button onClick={() => setIsAnnual(false)} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all z-10 ${!isAnnual ? 'text-white' : 'text-slate-500'}`}>Mensual</button>
      <button onClick={() => setIsAnnual(true)} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all z-10 ${isAnnual ? 'text-white' : 'text-slate-500'}`}>Anual</button>
      <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-blue-600 rounded-xl transition-all duration-500 ease-out ${isAnnual ? 'left-[calc(50%+2px)]' : 'left-1'}`} />
    </div>
    {isAnnual && (
      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-blue-400 text-[9px] font-black uppercase tracking-widest italic animate-pulse">
        ✨ 2 Meses de Seguridad de Regalo
      </motion.span>
    )}
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch relative z-10">
    
    {/* 1. PLAN FREE */}
    <div className="group bg-slate-950/70 border border-white/5 p-10 rounded-[3rem] text-left backdrop-blur-xl transition-all duration-500 hover:border-white/20 hover:-translate-y-2 flex flex-col shadow-2xl shadow-black/30">
      <div className="mb-8 text-white">
        <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-3 italic">Acceso Ciudadano</p>
        <h4 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-3">Vortex Free</h4>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-5xl font-black">0€</span>
          <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest">/ siempre</span>
        </div>
      </div>
      <ul className="space-y-5 mb-12 flex-grow">
        {[
          '5 Vórtices / hora (Max 100MB)',
          '1 Alias Fantasma Activo',
          'Dead Man Switch Básico (30 días)',
          'Cifrado XChaCha20-Poly1305',
          'Arquitectura Zero-Knowledge'
        ].map((text, i) => (
          <li key={i} className="flex items-start gap-4 text-slate-400 text-sm font-bold leading-tight">
            <Check size={16} className="text-slate-600 shrink-0 mt-0.5"/> <span>{text}</span>
          </li>
        ))}
      </ul>
      <button disabled className="w-full py-5 rounded-2xl border border-white/5 text-slate-700 font-black text-[10px] uppercase tracking-[0.3em] bg-white/[0.02] cursor-default">
        Plan Activo
      </button>
    </div>

    {/* 2. PLAN PREMIUM (PRO) - 10GB */}
    <div className="group relative bg-slate-950/70 border-2 border-blue-600/50 p-10 rounded-[3rem] text-left backdrop-blur-2xl transition-all duration-700 hover:border-blue-500 hover:shadow-[0_0_60px_-15px_rgba(37,99,235,0.4)] hover:-translate-y-4 flex flex-col overflow-hidden shadow-2xl shadow-black/30">
      <div className="absolute top-0 right-0 bg-blue-600 px-6 py-2 rounded-bl-3xl text-[9px] font-black uppercase tracking-[0.2em] italic">Recomendado</div>
      <div className="mb-8 text-white">
        <p className="text-[10px] font-black tracking-widest text-blue-500 uppercase mb-3 italic">Protocolo Elite</p>
        <h4 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-3">Zyphro Pro <Sparkles size={20} className="text-blue-400 animate-pulse" /></h4>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-5xl font-black">{isAnnual ? '3,99€' : '4,99€'}</span>
          <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest">/ mes</span>
        </div>
      </div>
      <ul className="space-y-5 mb-12 flex-grow relative">
        {[
          'Vórtices y Alias Ilimitados',
          '10GB de Almacenamiento Cifrado',
          'Dead Man Switch Pro (Intervalos Custom)',
          'Prioridad en Nodos de Salida',
          'Todo lo del plan Free'
        ].map((text, i) => (
          <li key={i} className="flex items-start gap-4 text-white text-sm font-bold leading-tight">
            <Check size={16} className="text-blue-400 shrink-0 mt-0.5"/> <span>{text}</span>
          </li>
        ))}
      </ul>
      <button 
        onClick={() => handleCheckout(isAnnual ? 'price_1T59P6FpFa6kQPuzVk3UOfqq' : 'price_1TAYf2FpFa6kQPuztxhIESLJ')} 
        disabled={loading} 
        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-blue-600/40 active:scale-95 relative z-10"
      >
        {loading ? 'Sincronizando...' : 'Obtener Acceso Pro'}
      </button>
    </div>

    {/* 3. PLAN ULTIMATE - 50GB */}
    <div className="group bg-slate-950/70 border border-white/5 p-10 rounded-[3rem] text-left backdrop-blur-xl transition-all duration-500 hover:border-white/20 hover:-translate-y-2 flex flex-col shadow-2xl shadow-black/30">
      <div className="mb-8 text-white">
        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-3 italic">Soberanía Total (B2B)</p>
        <h4 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-3">Ultimate <Star size={20} className="text-yellow-500" /></h4>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-5xl font-black">{isAnnual ? '9,99€' : '11,99€'}</span>
          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">/ mes</span>
        </div>
      </div>
      <ul className="space-y-5 mb-12 flex-grow">
        {[
          '50GB Secure Drop',
          'Acceso a API y SDK Zyphro',
          'Logs de Auditoría de Acceso',
          'Soporte Técnico 24/7 Encriptado',
          'Todo lo del plan Pro'
        ].map((text, i) => (
          <li key={i} className="flex items-start gap-4 text-slate-300 text-sm font-bold leading-tight">
            <Check size={16} className="text-blue-500 shrink-0 mt-0.5"/> <span>{text}</span>
          </li>
        ))}
      </ul>
      <button 
        onClick={() => handleCheckout(isAnnual ? 'price_1T59PqFpFa6kQPuzn5i55xRk' : 'price_1TAYgAFpFa6kQPuzhTuU91BR')} 
        disabled={loading} 
        className="w-full py-5 rounded-2xl border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.3em] bg-white/5 hover:bg-white/10 transition-all active:scale-95"
      >
        {loading ? 'Sincronizando...' : 'Activar Ultimate'}
      </button>
    </div>
  </div>
</motion.div>
      </main>

      {/* --- NUEVO FOOTER ESTRUCTURADO Y OSCURO --- */}
      <footer className="bg-black/90 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-2 md:grid-cols-5 gap-12 text-left">
          
          {/* Columna Logo/Frase */}
          <div className="col-span-2 md:col-span-2 pr-10">
            <Link to="/" className="flex items-center mb-6">
              <span className="text-3xl font-black italic tracking-tighter text-blue-600 uppercase">ZYPHRO</span>
            </Link>
            <p className="text-slate-500 text-sm font-bold leading-relaxed max-w-sm">
              La infraestructura europea blindada para el transporte de secretos y herencia digital. Zero-Knowledge por diseño.
            </p>
          </div>

          {/* Columnas de Enlaces (Estilo Foto Internxt) */}
          {[
            { title: 'Productos', links: ['Secure Drop', 'Dead Man Switch', 'Anon Aliases', 'Precios'] },
            { title: 'Compañía', links: ['Sobre Nosotros', 'Seguridad', 'Código Abierto', 'Contacto'] },
            { title: 'Legal', links: ['Privacidad', 'Términos', 'RGPD', 'DPA'] }
          ].map((col, i) => (
            <div key={i}>
              <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-white mb-6 italic">{col.title}</h5>
              <ul className="space-y-4">
                {col.links.map(link => (
                  <li key={link}><Link to="#" className="text-sm font-bold text-slate-400 hover:text-blue-500 transition-colors">{link}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Línea final e iconos sociales */}
        <div className="max-w-7xl mx-auto px-6 py-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6 text-slate-600">
          <span className="text-[9px] font-black tracking-[0.5em] uppercase italic">ZYPHRO SECURITY © 2026</span>
          
          {/* Iconos Sociales Reales (Usando @tabler/icons-react) */}
          <div className="flex gap-6 items-center">
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-white transition-colors">
              <IconBrandX size={18} />
            </a>
            <a href="https://reddit.com" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-white transition-colors">
              <IconBrandReddit size={18} />
            </a>
            <a href="https://github.com/tu-usuario/zyphro" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-white transition-colors">
              <IconBrandGithub size={18} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;