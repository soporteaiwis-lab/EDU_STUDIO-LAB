
import React, { useState } from 'react';
import { Studio } from './components/Studio';
import { Dashboard } from './components/Dashboard';
import { UserMode, UserRole, APP_INFO } from './types';
import { GraduationCap, Music, User, LogOut, Sparkles, Command } from 'lucide-react';

// --- NUEVO COMPONENTE DE LOGO ARTÍSTICO ---
const ArtisticLogo = ({ size = 'normal' }: { size?: 'normal' | 'large' }) => {
    const dim = size === 'large' ? 'w-16 h-16' : 'w-10 h-10';
    const text = size === 'large' ? 'text-4xl' : 'text-xl';
    
    return (
        <div className="flex items-center gap-3">
            <div className={`relative ${dim} flex items-center justify-center`}>
                <div className="absolute inset-0 bg-gradient-to-tr from-violet-600 to-cyan-500 rounded-xl rotate-6 opacity-60 animate-pulse-slow"></div>
                <div className="absolute inset-0 bg-gradient-to-bl from-fuchsia-600 to-purple-600 rounded-xl -rotate-6 opacity-60 animate-pulse-slow" style={{animationDelay: '1s'}}></div>
                <div className="relative z-10 bg-black/80 backdrop-blur-sm w-[90%] h-[90%] rounded-lg flex items-center justify-center border border-white/10 shadow-inner">
                    <Command className={`text-white ${size === 'large' ? 'w-8 h-8' : 'w-5 h-5'}`} />
                </div>
            </div>
            <div className="flex flex-col">
                <span className={`font-brand font-black tracking-tight text-white ${text} leading-none`}>
                    EDU<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">STUDIO</span>
                </span>
                {size === 'large' && <span className="text-xs font-bold text-gray-500 tracking-[0.3em] uppercase mt-1">Creative Lab</span>}
            </div>
        </div>
    );
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<'LOGIN' | 'DASHBOARD' | 'STUDIO'>('LOGIN');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [mode, setMode] = useState<UserMode>(UserMode.EXPLORER);

  const handleLogin = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === UserRole.TEACHER) {
        setMode(UserMode.PRO);
    }
    setCurrentPage('DASHBOARD');
  };

  const handleLaunchStudio = () => {
    setCurrentPage('STUDIO');
  };

  // 1. LOGIN SCREEN (VISUAL OVERHAUL)
  if (currentPage === 'LOGIN') {
    return (
      <div className="h-full w-full relative overflow-hidden flex items-center justify-center p-4">
         {/* ARTISTIC BACKGROUND (Simulated AI Art) */}
         <div className="absolute inset-0 bg-black">
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
             <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black"></div>
             {/* Floating Orbs */}
             <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[100px] animate-float"></div>
             <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/30 rounded-full blur-[100px] animate-float" style={{animationDelay: '2s'}}></div>
         </div>

         <div className="glass-panel p-10 rounded-[2.5rem] max-w-4xl w-full relative z-10 animate-slide-up border-t border-white/20">
            
            <div className="flex flex-col md:flex-row items-center gap-12">
                
                {/* Left: Branding */}
                <div className="flex-1 text-center md:text-left space-y-6">
                    <ArtisticLogo size="large" />
                    <p className="text-xl text-gray-300 font-light leading-relaxed max-w-sm">
                        Donde la música se encuentra con el futuro. <br/>
                        <span className="text-cyan-400 font-bold">Crea, Aprende e Innova</span> con Inteligencia Artificial.
                    </p>
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-400 backdrop-blur-md">
                        <Sparkles size={14} className="mr-2 text-yellow-400"/> Potenciado por Gemini AI
                    </div>
                </div>

                {/* Right: Login Cards */}
                <div className="flex-1 w-full grid gap-4">
                    <button 
                        onClick={() => handleLogin(UserRole.STUDENT)}
                        className="group relative overflow-hidden bg-gradient-to-br from-blue-900/50 to-cyan-900/50 hover:from-blue-800/60 hover:to-cyan-800/60 border border-blue-500/30 p-6 rounded-2xl transition-all hover:scale-[1.02] text-left"
                    >
                        <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <User className="text-white" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Soy Alumno</h3>
                                <p className="text-blue-200 text-sm">Entrar a mi espacio creativo</p>
                            </div>
                        </div>
                    </button>

                    <button 
                        onClick={() => handleLogin(UserRole.TEACHER)}
                        className="group relative overflow-hidden bg-gradient-to-br from-purple-900/50 to-pink-900/50 hover:from-purple-800/60 hover:to-pink-800/60 border border-purple-500/30 p-6 rounded-2xl transition-all hover:scale-[1.02] text-left"
                    >
                        <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                <GraduationCap className="text-white" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Soy Profesor</h3>
                                <p className="text-purple-200 text-sm">Gestión académica y evaluación</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            <div className="mt-10 pt-6 border-t border-white/5 flex justify-between items-center text-xs text-gray-500">
                <span>{APP_INFO.company} © {APP_INFO.year}</span>
                <span className="font-mono opacity-50">v{APP_INFO.version}</span>
            </div>
         </div>
      </div>
    );
  }

  // 2. MAIN APP LAYOUT (Premium Dark Theme)
  return (
    <div className="h-full w-full flex flex-col bg-[#050505] overflow-hidden relative">
      
      {/* GLOBAL NAVBAR (Floating Glass) */}
      {currentPage !== 'STUDIO' && (
        <div className="absolute top-0 left-0 right-0 z-50 p-6 pointer-events-none">
            <nav className="max-w-7xl mx-auto glass-panel rounded-2xl p-3 flex justify-between items-center pointer-events-auto shadow-2xl">
              <div 
                  className="flex items-center cursor-pointer pl-2"
                  onClick={() => setCurrentPage('DASHBOARD')}
              >
                  <ArtisticLogo />
              </div>

              <div className="flex items-center gap-6 pr-2">
                  <div className="flex items-center gap-3">
                      <div className="text-right hidden md:block">
                          <p className="text-sm font-bold text-white">{role === UserRole.TEACHER ? 'Prof. González' : 'Juanito Pérez'}</p>
                          <p className="text-xs text-gray-400">{role === UserRole.TEACHER ? 'Docente Música' : '5° Básico A'}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-b from-gray-700 to-black p-[2px] shadow-lg">
                          <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center">
                            {role === UserRole.TEACHER ? <GraduationCap size={18} className="text-gray-300" /> : <User size={18} className="text-gray-300" />}
                          </div>
                      </div>
                  </div>
                  <div className="w-px h-8 bg-white/10"></div>
                  <button onClick={() => setCurrentPage('LOGIN')} className="text-gray-400 hover:text-red-400 transition-colors" title="Cerrar Sesión">
                      <LogOut size={20} />
                  </button>
              </div>
            </nav>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 relative overflow-hidden">
          
          {/* DASHBOARD VIEW */}
          {currentPage === 'DASHBOARD' && (
             <div className="absolute inset-0 overflow-y-auto custom-scrollbar bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#050505] to-black pt-28">
                <div className="pb-20"> 
                    <Dashboard role={role} onLaunchStudio={handleLaunchStudio} />
                </div>
             </div>
          )}

          {/* STUDIO VIEW */}
          {currentPage === 'STUDIO' && (
             <div className="absolute inset-0 bg-black">
                <Studio userMode={mode} onExit={() => setCurrentPage('DASHBOARD')} />
             </div>
          )}
      </main>
    </div>
  );
}
