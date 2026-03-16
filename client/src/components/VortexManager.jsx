import React, { useState, useEffect, useMemo } from 'react';
import { Copy, Clock, Trash2, Shield, Eye, ArrowUpDown, Calendar, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from "@clerk/clerk-react";
import { API_URL } from '../apiConfig';

const TimeRemaining = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const calculateTime = () => {
      const difference = new Date(expiresAt) - new Date();
      if (difference <= 0) return "Expirado";
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      let text = "";
      if (days > 0) text += `${days}d `;
      if (hours > 0 || days > 0) text += `${hours}h `;
      text += `${minutes}m`;
      return text;
    };
    setTimeLeft(calculateTime());
    const timer = setInterval(() => setTimeLeft(calculateTime()), 60000);
    return () => clearInterval(timer);
  }, [expiresAt]);
  return <span>{timeLeft}</span>;
};

export default function VortexManager() {
  const [vortices, setVortices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); 
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const { getToken } = useAuth();

  const fetchVortices = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/v1/vortex/user?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setVortices(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Error de sincronización");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVortices(); }, []);

  // --- LÓGICA DE FILTRADO Y ORDENACIÓN ---
  const processedVortices = useMemo(() => {
    // ⚡ FILTRO DE SEGURIDAD: Primero quitamos los activos de herencia
    let items = vortices.filter(v => v.title && !v.title.startsWith("[HERENCIA]"));

    // 1. Filtrar por estado (lo que ya tenías)
    if (filter === 'active') {
      items = items.filter(v => new Date(v.expiresAt) > new Date() && (v.viewCount < v.maxViews));
    } else if (filter === 'expired') {
      items = items.filter(v => new Date(v.expiresAt) <= new Date() || (v.viewCount >= v.maxViews));
    }

    // 2. Ordenar (lo que ya tenías)
    items.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'createdAt' || sortConfig.key === 'expiresAt') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return items;
  }, [vortices, filter, sortConfig]);

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Deseas destruir este secreto permanentemente?")) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/v1/vortex/delete/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setVortices(vortices.filter(v => v.id !== id));
        toast.success("Vórtice desintegrado");
      }
    } catch (err) { toast.error("Error de conexión"); }
  };

  const handleCopyLink = (id) => {
    const baseUrl = window.location.origin;
    const fullUrl = `${baseUrl}/drop?id=${id}`;
    const savedKey = localStorage.getItem(`vortex_key_${id}`);
    const finalUrl = savedKey ? `${fullUrl}#${savedKey}` : fullUrl;
    navigator.clipboard.writeText(finalUrl).then(() => {
      toast.success(savedKey ? "Enlace completo copiado" : "ID copiado (falta Key)", { icon: savedKey ? '🔐' : '🔗' });
    });
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Accediendo a Bóveda...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-3xl">
        <div className="flex gap-1 bg-black/20 p-1 rounded-xl border border-white/5">
          {['all', 'active', 'expired'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                filter === f ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Expirados'}
            </button>
          ))}
        </div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Mostrando {processedVortices.length} Nodos
        </div>
      </div>

      <div className="relative bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden">
        <div className="max-h-[500px] overflow-y-auto scrollbar-hide">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 bg-[#0a0f1d] z-10 border-b border-white/10">
              <tr className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                <th className="px-6 py-4 cursor-pointer hover:text-blue-400 transition-colors" onClick={() => requestSort('createdAt')}>
                  <div className="flex items-center gap-2">Creación <ArrowUpDown size={12}/></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-blue-400 transition-colors" onClick={() => requestSort('viewCount')}>
                  <div className="flex items-center gap-2">Vistas <ArrowUpDown size={12}/></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-blue-400 transition-colors" onClick={() => requestSort('expiresAt')}>
                  <div className="flex items-center gap-2">Estado / Expira <ArrowUpDown size={12}/></div>
                </th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {processedVortices.map((v) => {
                const isExpired = new Date(v.expiresAt) <= new Date() || (v.viewCount >= v.maxViews);
                return (
                  <tr key={v.id} className={`group transition-all ${isExpired ? 'bg-rose-500/[0.02] opacity-60' : 'hover:bg-white/[0.04]'}`}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <Calendar size={14} className="text-slate-500" />
                        <span className="text-[10px] font-bold text-slate-300">
                          {new Date(v.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        <Eye size={12} /> {v.viewCount} / {v.maxViews}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-wider ${isExpired ? 'text-rose-500' : 'text-blue-400'}`}>
                        <Clock size={12} /> 
                        <TimeRemaining expiresAt={v.expiresAt} />
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleCopyLink(v.id)} className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all active:scale-95">
                          <Copy size={14} />
                        </button>
                        <button onClick={() => handleDelete(v.id)} className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all active:scale-95">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {processedVortices.length === 0 && (
        <div className="p-20 text-center border border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
          <Shield size={40} className="mx-auto text-slate-800 mb-4" />
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Protocolo de Bóveda: Sin registros</p>
        </div>
      )}
    </div>
  );
}