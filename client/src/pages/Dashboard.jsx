import { useUser, SignOutButton, useAuth } from "@clerk/clerk-react";
import { Link } from 'react-router-dom';
import { 
  LogOut, Zap, Key, ShieldCheck, 
  Database, Sparkles, Share2, ShieldAlert
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { API_URL } from '../apiConfig';
import ApiKeyManager from '../components/ApiKeyManager';
import VortexManager from '../components/VortexManager';

function Dashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [userStats, setUserStats] = useState({ plan: 'FREE', used: 0, limit: 104857600 });

  // --- TEMAS POR PLAN (Mantenemos la coherencia visual) ---
  const planTheme = useMemo(() => {
    const themes = {
      FREE: {
        text: 'text-slate-400',
        border: 'border-slate-500/30',
        bg: 'bg-slate-500/10',
        bar: 'bg-blue-600',
        glow: 'shadow-[0_0_10px_#2563eb]'
      },
      PRO: {
        text: 'text-blue-400',
        border: 'border-blue-500/50',
        bg: 'bg-blue-500/20',
        bar: 'bg-blue-500',
        glow: 'shadow-[0_0_15px_#3b82f6]'
      },
      ULTIMATE: {
        text: 'text-emerald-400',
        border: 'border-emerald-500/50',
        bg: 'bg-emerald-500/20',
        bar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
        glow: 'shadow-[0_0_20px_#10b981]'
      }
    };
    return themes[userStats.plan] || themes.FREE;
  }, [userStats.plan]);

  const fetchUserData = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/v1/user/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data) {
        setUserStats({
          plan: data.plan,
          used: Number(data.usedStorage) || 0,
          limit: Number(data.storageLimit) || 104857600
        });
      }
    } catch (err) { 
      console.error("Error cargando perfil"); 
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [getToken]);

  const storagePercent = Math.min(100, (userStats.used / userStats.limit) * 100);
  
  const formattedUsed = useMemo(() => {
    const mb = userStats.used / (1024 * 1024);
    return mb >= 1024 ? `${(mb / 1024).toFixed(2)}GB` : `${mb.toFixed(1)}MB`;
  }, [userStats.used]);

  const formattedLimit = useMemo(() => {
    const limit = userStats.limit;
    if (limit >= 1073741824) return `${(limit / 1073741824).toFixed(0)}GB`;
    return `${(limit / 1048576).toFixed(0)}MB`;
  }, [userStats.limit]);

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans pb-20 selection:bg-blue-500/30">
      
      {/* NAVBAR SIMPLIFICADA */}
      <nav className="bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <Link to="/" className="flex items-center group">
            <span style={{ fontSize: '1.5rem', fontWeight: '900', fontStyle: 'italic', letterSpacing: '-0.05em', textTransform: 'uppercase', color: '#2563eb' }}>
              ZYPHRO
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">Motor Vortex Online</span>
            </div>
            <SignOutButton>
              <button className="flex items-center gap-2 bg-white/5 hover:bg-rose-500/20 hover:text-rose-500 text-slate-400 px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all border border-white/10 uppercase">
                <LogOut size={14} /> SALIR
              </button>
            </SignOutButton>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 mt-12">
        
        {/* HEADER: EL CENTRO DE CONTROL */}
        <div className="bg-slate-900/20 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-md relative overflow-hidden mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            <div className="flex items-center gap-6">
              <img src={user?.imageUrl} alt="Profile" className="w-20 h-20 rounded-[1.8rem] border-2 border-white/10 object-cover shadow-2xl" />
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <p className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${planTheme.text} ${planTheme.border} ${planTheme.bg}`}>
                    Nivel de Acceso: {userStats.plan}
                  </p>
                  {userStats.plan === 'FREE' && (
                    <Link to="/#pricing" className="text-blue-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 hover:underline">
                      <Sparkles size={10} /> Upgrade
                    </Link>
                  )}
                </div>
                <h2 className="text-4xl font-black italic uppercase text-white">{user?.firstName || "Agente"}</h2>
              </div>
            </div>

            {/* BARRA DE ANCHO DE BANDA (Sustituye al almacenamiento) */}
            <div className="bg-white/5 p-6 rounded-3xl border border-white/5 min-w-[300px]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Zap size={12} className="text-blue-500" /> Capacidad Vortex
                </span>
                <span className="text-[10px] font-black text-white">{formattedUsed} / {formattedLimit}</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${planTheme.bar} ${planTheme.glow}`}
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
              <p className="text-[8px] text-slate-600 mt-2 font-bold uppercase tracking-tighter">Espacio ocupado por cápsulas efímeras activas</p>
            </div>
          </div>
        </div>

        {/* ÁREA PRINCIPAL: VORTEX MANAGER (Protagonismo absoluto) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <Share2 size={16} className="text-blue-500" />
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Gestión de Cápsulas xChaCha20</h4>
              </div>
            </div>
            {/* El VortexManager ahora respira mejor en un espacio más grande */}
            <VortexManager isSummary={false} /> 
          </div>

          {/* LATERAL: SDK Y SEGURIDAD */}
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-blue-600/10 to-transparent p-8 rounded-[2.5rem] border border-blue-500/20 relative overflow-hidden group">
              <ShieldAlert className="absolute right-[-20px] top-[-20px] text-blue-500/5 w-40 h-40 group-hover:rotate-12 transition-transform" />
              <h3 className="text-xl font-black italic uppercase mb-4 flex items-center gap-2">
                <ShieldCheck className="text-blue-500" size={20} />
                Privacidad Total
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Cada Vortex está cifrado con <strong>xChaCha20-Poly1305</strong>. 
                Los archivos se fragmentan y se eliminan físicamente tras la expiración.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 px-4 text-slate-500">
                <Key size={14} />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">SDK para Desarrolladores</h4>
              </div>
              <div className="bg-slate-950/40 backdrop-blur-2xl p-2 rounded-[2.5rem] border border-white/5">
                <ApiKeyManager />
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default Dashboard;