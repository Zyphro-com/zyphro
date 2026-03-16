import React, { useState, useEffect } from 'react';
import { useAuth, SignedIn, UserButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { 
  Lock, Eye, X, Plus, Copy, ShieldCheck, 
  Trash2, Clock, ChevronDown, Cloud, Mail as MailIcon, 
  Terminal, ShieldAlert, LayoutGrid, Zap
} from 'lucide-react';
import { API_URL } from '../apiConfig';
import DmsConfig from '../components/DmsConfig';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function DeadManSwitch() {
  const { getToken, isLoaded, userId } = useAuth();
  
  // Estados de datos
  const [secrets, setSecrets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados de interfaz
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [saving, setSaving] = useState(false);

  const [selectedSecret, setSelectedSecret] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    if (isLoaded && userId) {
      fetchSecrets();
    }
  }, [isLoaded, userId]);

  const fetchSecrets = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/v1/vault`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const data = await res.json();
      
      // ⚡ FILTRADO FRONTEND: Solo mostramos los que son de Herencia
      // El backend ya debería enviarlos filtrados, pero esto es doble seguridad
      if (Array.isArray(data)) {
        const filtered = data
          .filter(s => s.title.startsWith("[HERENCIA]"))
          .map(s => ({
            ...s,
            displayTitle: s.title.replace("[HERENCIA] ", "") // Quitamos el tag para la UI
          }));
        setSecrets(filtered);
      }
    } catch (err) {
      console.error('Error de conexión con la bóveda digital.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/v1/vault`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        // ⚡ MARCADO CRÍTICO: Añadimos [HERENCIA] al título
        body: JSON.stringify({ 
          title: `[HERENCIA] ${newTitle}`, 
          content: newContent, 
          type: 'note' 
        })
      });
      if (!res.ok) throw new Error('Error al cifrar el activo');
      
      toast.success("Activo asegurado en la bóveda", {
        style: { background: '#020617', color: '#fff', border: '1px solid #1e293b' }
      });
      
      await fetchSecrets();
      setNewTitle('');
      setNewContent('');
      setIsFormOpen(false);
    } catch (err) {
      toast.error("Fallo en la inyección: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Confirmar destrucción permanente de este activo?")) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/v1/vault/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Activo purgado");
        fetchSecrets();
        setSelectedSecret(null);
      }
    } catch (err) {
      toast.error("Error al purgar activo");
    }
  };

  if (!isLoaded) return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617]">
      <div className="flex flex-col items-center gap-4">
        <Terminal className="text-blue-500 animate-pulse" size={40} />
        <span className="text-blue-500 font-mono text-[10px] tracking-[0.3em] uppercase">Sincronizando Bóveda...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* NAVBAR */}
      <nav className="max-w-7xl mx-auto px-6 h-24 flex justify-between items-center relative z-[100]">
        <Link to="/" className="flex items-center group">
          <span className="text-3xl font-black italic tracking-tighter text-blue-600 uppercase">ZYPHRO</span>
        </Link>

        <div className="flex items-center gap-6">
           <Link to="/dashboard" className="text-[10px] font-black tracking-widest uppercase text-slate-400 hover:text-white transition-all">Dashboard</Link>
           <SignedIn><UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-9 h-9 border border-blue-500/50 shadow-lg" } }} /></SignedIn>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-12 pb-24 relative z-10">
        
        {/* CONFIGURACIÓN DEL DMS */}
        <div className="mb-20 space-y-8">
          <div className="flex items-center gap-3 px-4">
            <div className="p-2 bg-blue-600/20 rounded-lg"><ShieldAlert size={18} className="text-blue-500" /></div>
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Protocolo de Supervivencia Digital</h4>
          </div>
          <DmsConfig isSummary={false} />
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent mb-20" />

        {/* CABECERA DE BÓVEDA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h1 className="text-6xl font-black tracking-tighter text-white italic uppercase mb-2">Bóveda de Herencia</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
              <Lock size={14} className="text-blue-600" /> Los activos solo se liberarán tras el disparo del protocolo.
            </p>
          </div>
          
          <button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className={`group px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl active:scale-95 ${isFormOpen ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700'}`}
          >
            {isFormOpen ? <X size={16} /> : <Plus size={16} />}
            {isFormOpen ? 'Cancelar Inyección' : 'Inyectar Activo'}
          </button>
        </div>

        {/* FORMULARIO DE NUEVO SECRETO */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="mb-16 bg-slate-900/40 border border-white/10 p-10 rounded-[2.5rem] backdrop-blur-3xl shadow-2xl"
            >
              <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 italic">Nombre del Activo</label>
                    <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-blue-600 outline-none font-bold" placeholder="Ej: Semillas Ledger" />
                  </div>
                  <div className="space-y-3 text-right">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2 italic">Método de Cifrado</label>
                    <div className="w-full bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 text-[10px] font-mono text-blue-400 uppercase text-center">XCHACHA20_POLY1305_READY</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 italic">Contenido Protegido</label>
                  <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-blue-50 h-40 focus:border-blue-600 outline-none font-mono text-sm resize-none shadow-inner" placeholder="Pega aquí la información sensible..." />
                </div>
                <button disabled={saving} className="w-full bg-white text-black hover:bg-slate-200 py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all disabled:opacity-50">
                  {saving ? 'Blindando Información...' : 'Asegurar Activo en Bóveda'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GRID DE ACTIVOS */}
        {loading ? (
          <div className="text-center py-20 text-slate-600 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse italic">Escaneando sectores de memoria...</div>
        ) : secrets.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
            <p className="text-slate-600 font-black text-[10px] uppercase tracking-widest">Bóveda vacía. No hay activos de herencia configurados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 italic">
            {secrets.map((secret) => (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                key={secret.id} 
                onClick={() => { setSelectedSecret(secret); setIsRevealed(false); }} 
                className="bg-slate-900/40 border border-white/5 p-8 rounded-[2rem] hover:bg-slate-800/60 hover:border-blue-600/30 transition-all cursor-pointer group shadow-xl"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-blue-600/10 p-3 rounded-xl text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg"> <Lock size={18} /> </div>
                  <span className="text-[9px] font-mono text-slate-600 uppercase"> {new Date(secret.createdAt).toLocaleDateString()} </span>
                </div>
                {/* ⚡ IMPORTANTE: Usamos displayTitle para ocultar el prefijo [HERENCIA] */}
                <h3 className="text-lg font-black tracking-tight text-white mb-4 uppercase">{secret.displayTitle}</h3>
                <div className="flex items-center gap-2 text-[9px] text-emerald-500 font-black tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> CIFRADO Y ASEGURADO
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* MODAL DE DETALLE */}
        <AnimatePresence>
          {selectedSecret && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-[#020617]/95 backdrop-blur-xl">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="bg-slate-950 border border-white/10 w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl"
              >
                <div className="bg-white/5 p-8 border-b border-white/5 flex justify-between items-center">
                  <div>
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1 italic">Visualización Segura</p>
                    <h2 className="text-2xl font-black italic uppercase text-white tracking-tighter">{selectedSecret.displayTitle}</h2>
                  </div>
                  <button onClick={() => setSelectedSecret(null)} className="text-slate-500 hover:text-white transition-colors p-2 bg-white/5 rounded-full"> <X size={20} /> </button>
                </div>
                <div className="p-10">
                  <div className="relative mb-8">
                    <div className={`bg-black/60 border border-white/5 p-8 rounded-[1.5rem] font-mono text-sm text-blue-200 break-all transition-all duration-700 leading-relaxed ${isRevealed ? 'blur-none' : 'blur-xl select-none'}`}>
                      {selectedSecret.content}
                    </div>
                    {!isRevealed && (
                      <div onClick={() => setIsRevealed(true)} className="absolute inset-0 flex items-center justify-center cursor-pointer group">
                        <div className="bg-blue-600 text-white px-8 py-4 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl group-hover:scale-105 transition-all">
                          <Eye size={16} /> Revelar Contenido
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => {navigator.clipboard.writeText(selectedSecret.content); toast.success("Copiado al portapapeles")}} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-xl font-black text-[10px] uppercase transition-all border border-white/10 flex items-center justify-center gap-2 tracking-widest"> <Copy size={16} /> </button>
                    <button onClick={() => handleDelete(selectedSecret.id)} className="flex-1 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white py-4 rounded-xl font-black text-[10px] uppercase transition-all border border-rose-500/20 flex items-center justify-center gap-2 tracking-widest"> <Trash2 size={16} /> </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}