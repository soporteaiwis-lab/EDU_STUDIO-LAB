import React, { useState } from 'react';
import { Studio } from './components/Studio';
import { Dashboard } from './components/Dashboard';
import { UserMode, UserRole, APP_INFO } from './types';
import { GraduationCap, Music, User } from 'lucide-react';

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

  // 1. LOGIN SCREEN
  if (currentPage === 'LOGIN') {
    return (
      <div className="min-h-screen bg-lego flex flex-col items-center justify-center p-4">
         <div className="bg-white p-8 rounded-[3rem] shadow-xl max-w-2xl w-full text-center border-b-8 border-gray-200">
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 mb-2 font-fredoka">EduStudio</h1>
            <p className="text-gray-500 text-xl font-nunito mb-12">Plataforma Creativa Escolar v{APP_INFO.version}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                    onClick={() => handleLogin(UserRole.STUDENT)}
                    className="group bg-blue-50 border-4 border-blue-100 hover:border-blue-400 rounded-3xl p-8 flex flex-col items-center transition-all hover:-translate-y-2"
                >
                    <div className="bg-blue-500 text-white p-4 rounded-full mb-4 group-hover:scale-110 transition-transform shadow-lg">
                        <User size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-blue-800">Soy Alumno</h3>
                    <p className="text-blue-600">Entrar a mis clases y crear música</p>
                </button>

                <button 
                    onClick={() => handleLogin(UserRole.TEACHER)}
                    className="group bg-orange-50 border-4 border-orange-100 hover:border-orange-400 rounded-3xl p-8 flex flex-col items-center transition-all hover:-translate-y-2"
                >
                    <div className="bg-orange-500 text-white p-4 rounded-full mb-4 group-hover:scale-110 transition-transform shadow-lg">
                        <GraduationCap size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-orange-800">Soy Profesor</h3>
                    <p className="text-orange-600">Gestionar cursos y evaluar</p>
                </button>
            </div>
            
            <div className="mt-12 pt-8 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-bold mb-1">Creado por {APP_INFO.creator}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">{APP_INFO.company} | Chile {APP_INFO.year}</p>
            </div>
         </div>
      </div>
    );
  }

  // 2. MAIN APP
  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Global Nav */}
      <nav className="bg-white shadow-sm p-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div 
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => setCurrentPage('DASHBOARD')}
            >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                    E
                </div>
                <span className="font-fredoka font-bold text-xl text-gray-700">EduStudio <span className="text-xs opacity-50">v{APP_INFO.version}</span></span>
            </div>

            <div className="flex items-center space-x-4">
                {currentPage === 'STUDIO' && (
                    <div className="bg-gray-100 rounded-lg p-1 flex text-xs font-bold">
                        <button onClick={() => setMode(UserMode.EXPLORER)} className={`px-3 py-1 rounded transition-colors ${mode === UserMode.EXPLORER ? 'bg-white shadow text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}>Básico</button>
                        <button onClick={() => setMode(UserMode.MAKER)} className={`px-3 py-1 rounded transition-colors ${mode === UserMode.MAKER ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>Medio</button>
                        <button onClick={() => setMode(UserMode.PRO)} className={`px-3 py-1 rounded transition-colors ${mode === UserMode.PRO ? 'bg-white shadow text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}>Pro</button>
                    </div>
                )}
                
                <div className="flex items-center space-x-2">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-gray-800">{role === UserRole.TEACHER ? 'Prof. González' : 'Juanito Pérez'}</p>
                        <p className="text-xs text-gray-500">{role === UserRole.TEACHER ? 'Docente Música' : '5° Básico A'}</p>
                    </div>
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 border-2 border-white shadow-sm">
                        {role === UserRole.TEACHER ? <GraduationCap size={20} /> : <User size={20} />}
                    </div>
                </div>
                <button onClick={() => setCurrentPage('LOGIN')} className="text-xs text-red-400 font-bold hover:underline">Salir</button>
            </div>
        </div>
      </nav>

      {currentPage === 'DASHBOARD' && (
        <Dashboard role={role} onLaunchStudio={handleLaunchStudio} />
      )}

      {currentPage === 'STUDIO' && (
        <Studio userMode={mode} onExit={() => setCurrentPage('DASHBOARD')} />
      )}

    </div>
  );
}