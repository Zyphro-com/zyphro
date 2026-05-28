import React, { useState, useEffect, useMemo } from 'react';
import { Copy, Clock, Trash2, Shield, Eye, ArrowUpDown, Calendar, FileText, Paperclip, Share2, Box } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from "@clerk/clerk-react";
import { API_URL } from '../apiConfig';

const TimeRemaining = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const calculateTime = () => {
      const difference = new Date(expiresAt) - new Date();
      if (difference <= 0) return "EXTINGUIDO";
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      return days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`;
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
      const res = await fetch(`${API_URL}/api/v1/vortex/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setVortices(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Error de sincronización con el motor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVortices(); }, []);

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processedVortices = useMemo(() => {
    let items = [...vortices];
    if (filter === 'active') items = items.filter(v => new Date(v.expiresAt) > new Date());
    if (filter === 'expired') items = items.filter(v => new Date(v.expiresAt) <= new Date());

    items.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'createdAt' || sortConfig.key === 'expiresAt') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      return sortConfig.direction === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
    return items;
  }, [vortices, filter, sortConfig]);

  const handleDelete = async (id) => {
    if (!confirm("¿Desintegrar esta cápsula permanentemente?")) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/v1/vortex/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setVortices(vortices.filter(v => v.id !== id));
        toast.success("Vórtice colapsado con éxito");
      }
    } catch (err) { toast.error("Fallo en la purga"); }
  };

  const handleCopyLink = (id) => {
    const fullUrl = `${window.location.origin}/download/${id}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      toast.success("Enlace de acceso copiado", { icon: '🛸' });
    });
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Sincronizando Órbita...</div>;

  return (
    <div className="space-y-6">
      {/* FILTROS TÁCTICOS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/40 border border-white/5 p-4 rounded-[2rem] backdrop-blur-md">
        <div className="flex gap-2 p-1 bg-black/40 rounded-2xl">
          {['all', 'active', 'expired'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                filter === f ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
              }`}
            >
              {f === 'all' ? 'Cápsulas' : f === 'active' ? 'En Órbita' : 'Extinguidas'}
            </button>
          ))}
        </div>
        <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
              Nodos: {processedVortices.length}
            </span>
        </div>
      </div>

      {/* TABLA VORTEX */}
      <div className="bg-slate-900/20 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                <th className="px-8 py-6">Tipo / Nombre</th>
                <th className="px-8 py-6">Tamaño</th>
                <th className="px-8 py-6">Vistas</th>
                <th className="px-8 py-6">Expiración</th>
                <th className="px-8 py-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {processedVortices.map((v) => {
                const isExpired = new Date(v.expiresAt) <= new Date();
                return (
                  <tr key={v.id} className={`group transition-all ${isExpired ? 'opacity-40 grayscale' : 'hover:bg-white/[0.02]'}`}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${v.type === 'TEXT' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                          {v.type === 'TEXT' ? <FileText size={18} /> : <Paperclip size={18} />}
                        </div>
                        <div>
                          <p className="text-xs font-black text-white uppercase tracking-tight truncate max-w-[150px]">
                            {v.fileName || "Nota Cifrada"}
                          </p>
                          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                            {new Date(v.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black text-slate-400">{formatSize(v.fileSize)}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        <Eye size={12} className="text-blue-500/50" /> {v.downloadCount || 0}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-wider ${isExpired ? 'text-rose-500' : 'text-blue-400'}`}>
                        <Clock size={12} /> 
                        <TimeRemaining expiresAt={v.expiresAt} />
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-3">
                        {!isExpired && (
                          <button onClick={() => handleCopyLink(v.id)} className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-all">
                            <Share2 size={16} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(v.id)} className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {processedVortices.length === 0 && (
          <div className="p-32 text-center">
            <Box size={48} className="mx-auto text-slate-800 mb-6 opacity-20" />
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Sin cápsulas activas en este sector</p>
          </div>
        )}
      </div>
    </div>
  );
}