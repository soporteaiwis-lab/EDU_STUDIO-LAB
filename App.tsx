
import React, { useState } from 'react';
import { Studio } from './components/Studio';
import { Dashboard } from './components/Dashboard';
import { UserMode, UserRole, APP_INFO } from './types';
import { GraduationCap, Music, User, LogOut, Sparkles } from 'lucide-react';

// --- NUEVO LOGO OFICIAL (LIBRO + NOTA) ---
const EduStudioLogo = ({ size = 'normal' }: { size?: 'normal' | 'large' }) => {
    const dim = size === 'large' ? 'w-24 h-24' : 'w-10 h-10';
    const textSize = size === 'large' ? 'text-5xl' : 'text-xl';
    const subTextSize = size === 'large' ? 'text-sm' : 'text-[0.6rem]';
    
    return (
        <div className="flex items-center gap-4">
            {/* SVG LOGO: Concepto Libro + Nota Musical */}
            <div className={`${dim} relative drop-shadow-lg filter hover:brightness-110 transition-all duration-300`}>
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    {/* Página Derecha (Naranja/Libro) */}
                    <path d="M50 82C50 82 75 88 88 78V28C75 38 50 32 50 32V82Z" fill="url(#paint0_linear)" stroke="#EA580C" strokeWidth="2"/>
                    
                    {/* Página Izquierda / Tallo de Nota (Azul) */}
                    <path d="M50 82C50 82 25 88 12 78V28C25 38 50 32 50 32V82Z" fill="#E0F2FE" opacity="0.3"/>
                    
                    {/* Nota Musical (Formando el lomo y la izquierda) */}
                    <path d="M48 82V20L75 12V28" stroke="#0EA5E9" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="38" cy="82" r="12" fill="#0EA5E9"/>
                    
                    {/* Definición de Degradados */}
                    <defs>
                        <linearGradient id="paint0_linear" x1="50" y1="28" x2="88" y2="78" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#FDBA74"/>
                            <stop offset="1" stopColor="#F97316"/>
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            <div className="flex flex-col justify-center">
                <span className={`font-brand font-black tracking-tight text-white ${textSize} leading-none`}>
                    Edu<span className="text-[#0EA5E9]">Studio</span>
                </span>
                <span className={`${subTextSize} font-bold text-gray-400 tracking-[0.2em] uppercase mt-1`}>
                    Plataforma Creativa
                </span>
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
    // Default modes based on role, but can be changed in Studio
    if (selectedRole === UserRole.TEACHER) {
        setMode(UserMode.PRO);
    } else {
        setMode(UserMode.EXPLORER);
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
         {/* ARTISTIC BACKGROUND */}
         <div className="absolute inset-0 bg-black">
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
             <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black"></div>
             {/* Floating Orbs */}
             <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] animate-float"></div>
             <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/20 rounded-full blur-[100px] animate-float" style={{animationDelay: '2s'}}></div>
         </div>

         <div className="glass-panel p-10 rounded-[2.5rem] max-w-5xl w-full relative z-10 animate-slide-up border-t border-white/10 shadow-2xl">
            
            <div className="flex flex-col md:flex-row items-center gap-16">
                
                {/* Left: Branding */}
                <div className="flex-1 text-center md:text-left space-y-8">
                    <EduStudioLogo size="large" />
                    <p className="text-xl text-gray-300 font-light leading-relaxed max-w-md">
                        La plataforma escolar donde la <span className="text-orange-400 font-bold">música</span> y la <span className="text-blue-400 font-bold">tecnología</span> se unen.
                    </p>
                    <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm font-bold text-gray-400 backdrop-blur-md">
                        <Sparkles size={16} className="mr-2 text-yellow-400"/> Potenciado por Google Gemini
                    </div>
                </div>

                {/* Right: Login Cards */}
                <div className="flex-1 w-full grid gap-5">
                    <button 
                        onClick={() => handleLogin(UserRole.STUDENT)}
                        className="group relative overflow-hidden bg-gradient-to-br from-[#0EA5E9]/20 to-blue-900/40 hover:from-[#0EA5E9]/30 hover:to-blue-800/50 border border-[#0EA5E9]/30 p-6 rounded-3xl transition-all hover:scale-[1.02] text-left shadow-lg"
                    >
                        <div className="flex items-center gap-5 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-[#0EA5E9] flex items-center justify-center shadow-lg shadow-blue-500/30 text-white transform group-hover:rotate-6 transition-transform">
                                <User size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1">Soy Alumno</h3>
                                <p className="text-blue-200 text-sm font-medium">Entrar a mi cuaderno digital</p>
                            </div>
                        </div>
                    </button>

                    <button 
                        onClick={() => handleLogin(UserRole.TEACHER)}
                        className="group relative overflow-hidden bg-gradient-to-br from-orange-500/20 to-red-900/40 hover:from-orange-500/30 hover:to-red-800/50 border border-orange-500/30 p-6 rounded-3xl transition-all hover:scale-[1.02] text-left shadow-lg"
                    >
                        <div className="flex items-center gap-5 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 text-white transform group-hover:-rotate-6 transition-transform">
                                <GraduationCap size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-1">Soy Profesor</h3>
                                <p className="text-orange-200 text-sm font-medium">Gestión de clases y evaluación</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            <div className="mt-12 pt-6 border-t border-white/5 flex justify-between items-center text-xs text-gray-500 font-medium">
                <span>{APP_INFO.company} © {APP_INFO.year} • Chile</span>
                <span className="font-mono opacity-50">v{APP_INFO.version}</span>
            </div>
         </div>
      </div>
    );
  }

  // 2. MAIN APP LAYOUT
  return (
    <div className="h-full w-full flex flex-col bg-[#050505] overflow-hidden relative">
      
      {/* GLOBAL NAVBAR */}
      {currentPage !== 'STUDIO' && (
        <div className="absolute top-0 left-0 right-0 z-50 p-6 pointer-events-none">
            <nav className="max-w-7xl mx-auto glass-panel rounded-2xl p-3 pl-6 flex justify-between items-center pointer-events-auto shadow-2xl backdrop-blur-xl bg-black/60">
              <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => setCurrentPage('DASHBOARD')}
              >
                  <EduStudioLogo />
              </div>

              <div className="flex items-center gap-6 pr-2">
                  <div className="flex items-center gap-3">
                      <div className="text-right hidden md:block">
                          <p className="text-sm font-bold text-white">{role === UserRole.TEACHER ? 'Prof. González' : 'Juanito Pérez'}</p>
                          <p className="text-xs text-gray-400 font-medium">{role === UserRole.TEACHER ? 'Docente Música' : '5° Básico A'}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-b from-gray-700 to-black p-[2px] shadow-lg">
                          <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center">
                            {role === UserRole.TEACHER ? <GraduationCap size={18} className="text-gray-300" /> : <User size={18} className="text-gray-300" />}
                          </div>
                      </div>
                  </div>
                  <div className="w-px h-8 bg-white/10"></div>
                  <button onClick={() => setCurrentPage('LOGIN')} className="text-gray-400 hover:text-red-400 transition-colors p-2 hover:bg-white/5 rounded-full" title="Cerrar Sesión">
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
                <Studio userMode={mode} onModeChange={setMode} onExit={() => setCurrentPage('DASHBOARD')} />
             </div>
          )}
      </main>
    </div>
  );
}
