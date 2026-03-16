import { useUser, SignOutButton, useAuth } from "@clerk/clerk-react";
import { Link } from 'react-router-dom';
import { 
  LogOut, HeartPulse, Zap, Key, ShieldCheck, 
  ArrowUpRight, LayoutGrid, Activity, Mail, Database, Sparkles
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { API_URL } from '../apiConfig';
import ApiKeyManager from '../components/ApiKeyManager';
import DmsConfig from '../components/DmsConfig';
import VortexManager from '../components/VortexManager';
import toast from 'react-hot-toast';

function Dashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [mailStats, setMailStats] = useState({ active: 0, messages: 0 });
  const [userStats, setUserStats] = useState({ plan: 'FREE', used: 0, limit: 104857600 });
  const [isSyncing, setIsSyncing] = useState(false);

  // --- CONFIGURACIÓN DE COLORES POR PLAN ---
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
      console.error("Error cargando perfil del búnker"); 
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [getToken]);

  const handleCheckIn = async () => {
    setIsSyncing(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/switch/checkin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success("SEÑAL DE VIDA TRANSMITIDA", {
          style: { background: '#020617', color: '#3b82f6', border: '1px solid #1e293b', fontWeight: 'bold' }
        });
        fetchUserData(); 
      }
    } catch (err) {
      toast.error("FALLO EN LA TRANSMISIÓN");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/v1/mail/aliases`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setMailStats({ active: data.length, messages: 0 });
        }
      } catch (err) { console.error("Error en stats de mail"); }
    };
    fetchStats();
  }, [getToken]);

  // --- CÁLCULOS DINÁMICOS DE ALMACENAMIENTO ---
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
      
      <nav className="bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <Link to="/" className="flex items-center group">
            <span style={{ fontSize: '1.5rem', fontWeight: '900', fontStyle: 'italic', letterSpacing: '-0.05em', textTransform: 'uppercase', color: '#2563eb', paddingRight: '0.4em' }}>
              ZYPHRO
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <Link to="/mail" className="text-[10px] font-black tracking-widest uppercase text-slate-400 hover:text-blue-500 transition-all">Anon Mail</Link>
            <Link to="/switch" className="text-[10px] font-black tracking-widest uppercase text-slate-400 hover:text-blue-500 transition-all">Protocolo DMS</Link>
            <SignOutButton>
              <button className="flex items-center gap-2 bg-white/5 hover:bg-rose-500/20 hover:text-rose-500 text-slate-400 px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all border border-white/10 uppercase">
                <LogOut size={14} /> SALIR
              </button>
            </SignOutButton>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 mt-12">
        
        {/* HEADER PERFIL DINÁMICO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 bg-slate-900/20 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-md relative overflow-hidden group">
          <div className="flex items-center gap-6 relative z-10">
            <div className="relative">
              <div className={`absolute -inset-1 rounded-[2.2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 ${planTheme.bar}`}></div>
              <img src={user?.imageUrl} alt="Profile" className="relative w-24 h-24 rounded-[2rem] border-2 border-white/10 object-cover shadow-2xl" />
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-[#020617] ${planTheme.bar.split(' ')[0]}`}></div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full border ${planTheme.text} ${planTheme.border} ${planTheme.bg}`}>
                  Agente: {userStats.plan}
                </p>
                {userStats.plan === 'FREE' && (
                  <Link to="/#pricing" className="flex items-center gap-1.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 text-blue-400 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all animate-pulse">
                    <Sparkles size={10} /> Upgrade
                  </Link>
                )}
              </div>
              <h2 className="text-5xl font-black tracking-tight leading-none text-white italic uppercase mb-4">
                {user?.firstName || "Usuario"}
              </h2>
              
              {/* BARRA DE CAPACIDAD MEJORADA */}
              <div className="w-64">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Database size={10} /> Búnker: {storagePercent.toFixed(1)}%
                  </span>
                  <span className="text-[9px] font-black text-white tracking-widest">{formattedUsed} / {formattedLimit}</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out ${planTheme.bar} ${planTheme.glow} ${
                      storagePercent > 90 ? 'animate-pulse !bg-rose-500 shadow-rose-500' : ''
                    }`}
                    style={{ width: `${storagePercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleCheckIn}
            disabled={isSyncing}
            className={`group relative z-10 flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 ${
              isSyncing ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700'
            }`}
          >
            <HeartPulse className={isSyncing ? 'animate-spin' : 'group-hover:animate-ping'} size={18} />
            {isSyncing ? 'Sincronizando...' : 'Check-In de Seguridad'}
          </button>
          
          <Activity className="absolute right-[-20px] top-[-20px] text-white/5 w-64 h-64 -rotate-12 pointer-events-none" />
        </div>

        {/* RESTO DEL CONTENIDO PRINCIPAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Activos Efímeros (Vortex)</h4>
                </div>
                <VortexManager isSummary={true} /> 
            </div>

            <Link to="/mail" className="group block h-full">
                <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] h-full hover:border-blue-500/30 transition-all relative overflow-hidden shadow-2xl">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-4 bg-blue-600/10 rounded-2xl border border-blue-600/20 text-blue-500">
                            <Mail size={24} />
                        </div>
                        <span className="text-emerald-500 text-[8px] font-black px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">ACTIVE_RELAY</span>
                    </div>
                    <h3 className="text-3xl font-black italic uppercase text-white mb-2">Anon Mail</h3>
                    <div className="flex gap-6 mt-4">
                        <div>
                            <p className="text-2xl font-black italic text-white">{mailStats.active}</p>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nodos Activos</p>
                        </div>
                    </div>
                    <Zap className="absolute right-[-10px] bottom-[-10px] text-white/5 w-32 h-32" />
                </div>
            </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className={`text-blue-500`} />
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Protocolo Dead Man Switch</h4>
              </div>
              <Link to="/switch" className="text-[9px] font-black text-blue-500 hover:text-white transition-colors uppercase tracking-widest">Configurar Protocolo →</Link>
            </div>
            <DmsConfig isSummary={true} />
          </div>

          <div className="space-y-10">
            <div className="space-y-6">
              <div className="flex items-center gap-2 px-4">
                <Key size={16} className="text-blue-500" />
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Infraestructura de Desarrollador</h4>
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