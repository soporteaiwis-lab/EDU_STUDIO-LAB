
import React, { useState } from 'react';
import { Studio } from './components/Studio';
import { Dashboard } from './components/Dashboard';
import { UserMode, UserRole, APP_INFO } from './types';
import { GraduationCap, Music, User, LogOut, Sparkles } from 'lucide-react';

// --- NUEVO LOGO OFICIAL (LIBRO + NOTA) ---
// Recreación vectorial basada en la Opción 1 de la imagen proporcionada.
const EduStudioLogo = ({ size = 'normal' }: { size?: 'normal' | 'large' }) => {
    const isLarge = size === 'large';
    const dim = isLarge ? 'w-32 h-32' : 'w-10 h-10';
    const textSize = isLarge ? 'text-6xl' : 'text-xl';
    const subTextSize = isLarge ? 'text-lg' : 'text-[0.6rem]';
    const gap = isLarge ? 'gap-6' : 'gap-3';
    
    return (
        <div className={`flex flex-col md:flex-row items-center ${gap} justify-center`}>
            {/* SVG LOGO: Concepto Libro + Nota Musical */}
            <div className={`${dim} relative drop-shadow-2xl filter transition-transform duration-500 hover:scale-105`}>
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <defs>
                        <linearGradient id="bookGradient" x1="50" y1="30" x2="90" y2="80" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#F97316"/> {/* Orange-500 */}
                            <stop offset="1" stopColor="#EA580C"/> {/* Orange-600 */}
                        </linearGradient>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="2" result="blur"/>
                            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                        </filter>
                    </defs>

                    {/* Lomo / Página Izquierda (Forma de Nota) */}
                    <path d="M45 80 C 45 80, 20 85, 15 75 V 25 C 20 35, 45 30, 45 30 Z" 
                          fill="#0EA5E9" fillOpacity="0.1" stroke="#0EA5E9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>

                    {/* Página Derecha (Naranja Sólido) */}
                    <path d="M45 80 C 45 80, 70 88, 85 75 V 25 C 70 38, 45 30, 45 30 V 80 Z" 
                          fill="url(#bookGradient)" stroke="#C2410C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    
                    {/* Detalle hojas libro */}
                    <path d="M80 30 V 73 C 68 82, 50 78, 50 78" stroke="white" strokeWidth="2" strokeOpacity="0.4" fill="none"/>

                    {/* Nota Musical (Azul) - El tallo es el centro del libro */}
                    <path d="M45 80 V 20 L 70 12 V 25" stroke="#0284C7" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="34" cy="80" r="11" fill="#0284C7"/>
                    <circle cx="34" cy="80" r="7" fill="#38BDF8"/>
                </svg>
            </div>

            <div className={`flex flex-col ${isLarge ? 'text-center md:text-left' : 'text-left'}`}>
                <span className={`font-brand font-black tracking-tighter text-[#ff8000] dark:text-white ${textSize} leading-none drop-shadow-sm`}>
                    Edu<span className="text-[#0EA5E9]">Studio</span>
                </span>
                <span className={`${subTextSize} font-bold text-gray-500 tracking-[0.15em] uppercase mt-1`}>
                    Plataforma Creativa Escolar
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
    // Default modes based on role
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

  // 1. PANTALLA DE INGRESO (PORTADA UNIFICADA)
  if (currentPage === 'LOGIN') {
    return (
      <div className="h-full w-full relative overflow-hidden flex items-center justify-center p-6 bg-[#0f172a]">
         {/* FONDO ARTÍSTICO */}
         <div className="absolute inset-0">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1e293b] via-[#0f172a] to-black"></div>
             {/* Abstract musical shapes */}
             <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] animate-pulse-slow" style={{animationDelay: '2s'}}></div>
             <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
         </div>

         {/* TARJETA CENTRAL DE INGRESO */}
         <div className="relative z-10 w-full max-w-4xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-slide-up">
            
            {/* Columna Izquierda: Branding */}
            <div className="flex-1 p-10 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/10 bg-black/20 text-center">
                <div className="mb-8">
                    <EduStudioLogo size="large" />
                </div>
                <p className="text-gray-300 text-lg font-light leading-relaxed max-w-xs mx-auto">
                    Donde la creatividad musical se encuentra con la tecnología en el aula.
                </p>
                <div className="mt-8 flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
            </div>

            {/* Columna Derecha: Selección de Rol */}
            <div className="flex-1 p-10 flex flex-col justify-center space-y-6 bg-gradient-to-br from-white/5 to-transparent">
                <h2 className="text-2xl font-bold text-white text-center mb-4">¿Cómo deseas ingresar?</h2>
                
                <button 
                    onClick={() => handleLogin(UserRole.STUDENT)}
                    className="group relative overflow-hidden bg-[#0EA5E9]/10 hover:bg-[#0EA5E9]/20 border border-[#0EA5E9]/30 p-4 rounded-2xl transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(14,165,233,0.3)] flex items-center gap-4"
                >
                    <div className="w-12 h-12 bg-[#0EA5E9] rounded-xl flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform">
                        <User size={24} strokeWidth={2.5}/>
                    </div>
                    <div className="text-left">
                        <div className="text-lg font-bold text-white group-hover:text-[#0EA5E9] transition-colors">Soy Estudiante</div>
                        <div className="text-xs text-blue-200/70">Acceder a mis tareas y estudio</div>
                    </div>
                </button>

                <button 
                    onClick={() => handleLogin(UserRole.TEACHER)}
                    className="group relative overflow-hidden bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 p-4 rounded-2xl transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] flex items-center gap-4"
                >
                    <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:-rotate-12 transition-transform">
                        <GraduationCap size={24} strokeWidth={2.5}/>
                    </div>
                    <div className="text-left">
                        <div className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">Soy Profesor</div>
                        <div className="text-xs text-orange-200/70">Gestión de cursos y evaluación</div>
                    </div>
                </button>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-black/30 border border-white/5 text-xs text-gray-400">
                        <Sparkles size={12} className="mr-2 text-yellow-400"/> Potenciado por Gemini AI
                    </div>
                    <p className="text-[10px] text-gray-600 mt-4 uppercase tracking-widest">
                        {APP_INFO.company} © {APP_INFO.year} • v{APP_INFO.version}
                    </p>
                </div>
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
            <nav className="max-w-7xl mx-auto glass-panel rounded-2xl p-2 pl-4 flex justify-between items-center pointer-events-auto shadow-2xl backdrop-blur-xl bg-black/80 border border-white/10">
              <div 
                  className="flex items-center cursor-pointer transform hover:scale-105 transition-transform"
                  onClick={() => setCurrentPage('DASHBOARD')}
              >
                  {/* Logo pequeño en Navbar */}
                  <EduStudioLogo size="normal" />
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
