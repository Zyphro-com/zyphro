import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, Clock, RotateCcw, ArrowLeft, Lock, ChevronDown, 
  ShieldCheck, Link as LinkIcon, FileUp, X, FileText, 
  CheckCircle2, Download, Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cryptoUtils } from '../utils/crypto';
import { API_URL } from '../apiConfig';

// --- COMPONENTE DEL TEMPORIZADOR ---
const CountdownTimer = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expirationDate = new Date(expiresAt).getTime();
      const distance = expirationDate - now;
      if (isNaN(distance) || distance < 0) {
        setTimeLeft("EXPIRADO");
        clearInterval(interval);
      } else {
        const hours = Math.floor(distance / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="flex items-center gap-2 text-rose-500 font-black text-[10px] uppercase tracking-[0.2em] bg-rose-500/10 px-6 py-3 rounded-2xl border border-rose-500/20 animate-pulse">
      <Clock size={14} /> Autodestrucción: {timeLeft}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function SecureDrop() {
  const [mode, setMode] = useState('text'); // 'text' o 'file'
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [maxViews, setMaxViews] = useState(1);
  const [expirationHours, setExpirationHours] = useState(24);
  const [link, setLink] = useState('');
  const [incomingMsg, setIncomingMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const key = window.location.hash.substring(1);
    if (id && key) {
      hasFetched.current = true;
      fetchAndDecryptMessage(id, key);
    }
  }, []);

  // --- LÓGICA DE ARCHIVOS ---
  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) setFile(selectedFile);
  };

  const fetchAndDecryptMessage = async (id, key) => {
    setLoading(true);
    try {
      // 🚀 SOLUCIÓN 405: Forzamos método GET y cabeceras claras
      const res = await fetch(`${API_URL}/api/v1/vortex/${id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Mensaje destruido o inexistente.");
      }
      
      const data = await res.json();
      
      // 1. Desencriptación local xchacha20
      const decryptedData = await cryptoUtils.decryptData(data.content, key);
      if (!decryptedData) throw new Error("Llave de desencriptación inválida.");
      
      // 2. Comprobamos si es archivo o texto (Sincronizado con mayúsculas del backend)
      if (data.type?.toUpperCase() === 'FILE') {
        const byteCharacters = atob(decryptedData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/octet-stream' });
        
        const downloadUrl = URL.createObjectURL(blob);
        const cleanFileName = data.fileName || 'archivo_seguro.bin';
        
        setIncomingMsg({ ...data, content: downloadUrl, isFile: true, fileName: cleanFileName });
      } else {
        setIncomingMsg({ ...data, content: decryptedData, isFile: false });
      }

    } catch (err) { 
      console.error("Vortex Error:", err);
      toast.error(err.message || "Error al acceder a la cápsula."); 
      setTimeout(() => { window.location.href = '/drop'; }, 3000);
    } finally { 
      setLoading(false); 
    }
  };

  const handleCreate = async () => {
    if (mode === 'text' && !text) return toast.error("Escribe algo");
    if (mode === 'file' && !file) return toast.error("Selecciona un archivo");

    setLoading(true);
    try {
      const masterKey = await cryptoUtils.generateKey();
      
      const formData = new FormData();
      formData.append('maxViews', maxViews.toString());
      formData.append('expirationHours', expirationHours.toString());
      formData.append('type', mode.toUpperCase()); 
      
      if (mode === 'text') {
        const encryptedBase64 = await cryptoUtils.encryptData(text, masterKey);
        formData.append('content', encryptedBase64);
      } else {
        toast.loading("Cifrando xchacha20 localmente...", { id: 'encrypt' });
        
        const fileBuffer = await file.arrayBuffer();
        const base64File = btoa(new Uint8Array(fileBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
        const encryptedFileString = await cryptoUtils.encryptData(base64File, masterKey);
        
        const encryptedBlob = new Blob([encryptedFileString], { type: 'application/octet-stream' });
        
        formData.append('file', encryptedBlob, file.name);
        formData.append('fileName', file.name);
        toast.success("Cifrado completado", { id: 'encrypt' });
      }
      
      // 🚀 Forzamos POST (Ya lo tenías bien, pero aseguramos)
      const res = await fetch(`${API_URL}/api/v1/vortex/create`, {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fallo en el servidor");

      localStorage.setItem(`vortex_key_${data.vortexId}`, masterKey);
      const finalLink = `${window.location.origin}/drop?id=${data.vortexId}#${masterKey}`;
      setLink(finalLink);
      toast.dismiss();
      toast.success("Vórtice generado con éxito");

    } catch (err) { 
      console.error(err);
      toast.error(err.message || "Error al generar"); 
    } finally { 
      setLoading(false); 
    }
  };

  const labelStyle = "text-[10px] font-black uppercase text-blue-300/60 ml-3 tracking-widest mb-2 flex items-center gap-2";
  const selectStyle = "appearance-none w-full bg-[#0a101f]/80 backdrop-blur-xl border border-blue-900/30 rounded-2xl p-4 pr-12 text-xs font-bold uppercase text-blue-100 outline-none transition-all hover:border-blue-500/50 focus:border-blue-500 cursor-pointer tracking-wider";

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden relative">
      
      {/* NAVBAR */}
      <nav className="max-w-7xl mx-auto px-6 h-24 flex justify-between items-center relative z-[100]">
        <Link to="/drop" className="flex items-center">
          <span className="text-3xl font-black italic tracking-tighter text-blue-600 uppercase">ZYPHRO</span>
        </Link>
        <div className="text-[10px] font-black tracking-widest uppercase text-blue-500/60 bg-blue-500/5 px-4 py-2 rounded-xl border border-blue-500/10">
          🔒 Zero-Knowledge Node
        </div>
      </nav>

      <main className="flex flex-col items-center justify-center pt-10 pb-20 px-6">
        
        {/* SELECTOR DE MODO */}
        {!link && !incomingMsg && (
          <div className="flex bg-slate-900/60 p-1 rounded-2xl mb-8 border border-white/5">
            <button onClick={() => setMode('text')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'text' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Texto</button>
            <button onClick={() => setMode('file')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'file' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>Archivo</button>
          </div>
        )}

        <div className="w-full max-w-2xl bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden relative min-h-[450px]">
          {loading && (
            <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-10 text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                <Lock className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={24} />
              </div>
              <span className="text-xs font-black tracking-[0.3em] text-blue-400 uppercase animate-pulse">Cifrado xchacha20 en curso...</span>
              <p className="text-[9px] text-slate-500 mt-4 uppercase font-bold tracking-widest">Tus datos nunca abandonan tu dispositivo sin cifrar</p>
            </div>
          )}

          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#0a101f]/50 text-blue-500 font-black italic uppercase tracking-tighter">
            <div className="flex items-center gap-3">
                <ShieldCheck size={20} />
                <span>ZYPHRO <span className="text-[10px] not-italic text-blue-300/50 ml-1 font-bold tracking-widest uppercase">Secure Drop</span></span>
            </div>
            <button onClick={() => window.location.href='/drop'} className="p-2 text-slate-500 hover:text-blue-500 transition-transform hover:rotate-180 duration-500 bg-transparent border-none cursor-pointer outline-none">
              <RotateCcw size={18} />
            </button>
          </div>

          <div className="p-10">
            {!incomingMsg ? (
              !link ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                  
                  {mode === 'text' ? (
                    <div className="relative group">
                      <textarea value={text} onChange={(e) => setText(e.target.value)}
                        className="w-full h-56 bg-[#0a101f]/80 backdrop-blur-xl border border-blue-900/30 rounded-3xl p-8 text-sm focus:border-blue-500/50 outline-none resize-none text-blue-50 placeholder:text-blue-700/50 transition-all shadow-inner"
                        placeholder="Escribe aquí el secreto, credenciales o mensaje sensible..." />
                      <div className="absolute bottom-6 right-8 text-[9px] font-black uppercase text-blue-700/50 tracking-widest flex items-center gap-2">
                        <Lock size={10}/> End-to-End Encrypted
                      </div>
                    </div>
                  ) : (
                    <div 
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleFileDrop}
                      className={`w-full h-56 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-blue-900/30 bg-[#0a101f]/80'}`}
                    >
                      <input type="file" id="fileInput" onChange={handleFileSelect} className="hidden" />
                      {!file ? (
                        <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center gap-4 group">
                          <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FileUp className="text-blue-500" size={32} />
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-100">Arrastra un archivo o haz clic</p>
                            <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase italic">Máximo 500MB (Límite Global)</p>
                          </div>
                        </label>
                      ) : (
                        <div className="flex flex-col items-center gap-4 animate-in zoom-in-95">
                          <div className="bg-blue-600/20 p-4 rounded-2xl border border-blue-500/30 relative">
                            <FileText className="text-blue-400" size={40} />
                            <button onClick={(e) => { e.preventDefault(); setFile(null); }} className="absolute -top-2 -right-2 bg-rose-600 rounded-full p-1 border-2 border-[#020617] hover:bg-rose-500 transition-colors">
                              <X size={12} />
                            </button>
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-bold text-white max-w-[200px] truncate">{file.name}</p>
                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* CONFIGURACIÓN DE EXPIRACIÓN */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelStyle}><Eye size={12}/> Lecturas</label>
                      <div className="relative">
                        <select value={maxViews} onChange={(e) => setMaxViews(parseInt(e.target.value))} className={selectStyle}>
                          <option value="1">1 Solo Uso</option>
                          <option value="5">5 Visitas</option>
                          <option value="10">10 Visitas</option>
                          <option value="100">100 Visitas</option>
                        </select>
                        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className={labelStyle}><Clock size={12}/> Expiración</label>
                      <div className="relative">
                        <select value={expirationHours} onChange={(e) => setExpirationHours(parseInt(e.target.value))} className={selectStyle}>
                          <option value="1">1 Hora</option>
                          <option value="24">24 Horas</option>
                        </select>
                        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <button onClick={handleCreate} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98] flex items-center justify-center gap-3">
                    <Zap size={16} /> {mode === 'text' ? 'Generar Vórtice' : 'Cifrar y Subir'}
                  </button>
                </div>
              ) : (
                /* RESULTADO: ENLACE GENERADO */
                <div className="text-center space-y-10 py-8 animate-in zoom-in-95 duration-500">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center border border-blue-500/30 animate-pulse">
                        <CheckCircle2 className="text-emerald-500" size={40} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black uppercase text-blue-100 italic tracking-tighter">Vórtice Establecido</h3>
                    <p className="text-[10px] text-blue-300/70 font-black uppercase tracking-widest">Tus datos están blindados en la red</p>
                  </div>
                  <div className="bg-[#0a101f]/80 backdrop-blur-xl p-1 rounded-3xl border border-blue-900/30 flex items-center group">
                    <div className="p-4 text-blue-500"><LinkIcon size={18} /></div>
                    <input readOnly value={link} className="bg-transparent text-blue-100 font-mono text-[10px] w-full outline-none truncate pl-2" />
                    <button onClick={() => {navigator.clipboard.writeText(link); toast.success("Copiado")}} className="bg-blue-600 hover:bg-blue-700 text-white m-1 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                        Copiar
                    </button>
                  </div>
                </div>
              )
            ) : (
              /* VISTA DE DESENCRIPTACIÓN CON SOPORTE PARA BOTÓN DE DESCARGA */
              <div className="space-y-10 animate-in fade-in duration-700">
                <div className="flex flex-col items-center gap-4">
                  <CountdownTimer expiresAt={incomingMsg.expiresAt} />
                  <div className="text-[9px] font-black uppercase text-blue-300/70 tracking-widest bg-blue-900/20 px-5 py-2.5 rounded-full border border-blue-500/20">
                    Visitas restantes: <span className="text-blue-100">{incomingMsg.remainingViews}</span>
                  </div>
                </div>
                <div className="bg-[#0a101f]/80 backdrop-blur-xl border border-blue-900/30 rounded-3xl p-12 font-mono text-sm text-blue-50 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600/50 group-hover:bg-blue-600 transition-colors"></div>
                    
                    {incomingMsg.isFile ? (
                      <div className="flex flex-col items-center gap-6 py-4">
                        <div className="w-20 h-20 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/30">
                          <FileText className="text-blue-400" size={40} />
                        </div>
                        <div className="text-center mb-4">
                          <p className="text-lg font-black text-white truncate max-w-[250px]">{incomingMsg.fileName}</p>
                          <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Archivo Seguro Descifrado</p>
                        </div>
                        <a 
                          href={incomingMsg.content} 
                          download={incomingMsg.fileName} 
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98] flex items-center justify-center gap-3 decoration-none"
                        >
                          <Download size={18} /> Descargar Archivo
                        </a>
                      </div>
                    ) : (
                      <pre className="whitespace-pre-wrap break-words">{incomingMsg.content}</pre>
                    )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <p className="mt-12 text-[9px] text-slate-700 font-black uppercase tracking-[0.4em] flex items-center gap-2 opacity-50">
            <ShieldCheck size={10}/> xchacha20-poly1305 zero-knowledge protocol
        </p>
      </main>
    </div>
  );
}