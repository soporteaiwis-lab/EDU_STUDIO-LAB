
import React, { useState } from 'react';
import { Assignment, UserRole } from '../types';
import { BookOpen, Users, Plus, FileAudio, CheckCircle, Clock } from 'lucide-react';
import { TeacherDashboard } from './TeacherDashboard';

interface DashboardProps {
  role: UserRole;
  onLaunchStudio: (assignmentId?: string) => void;
}

const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: '1', courseId: 'c1', title: 'Creación de Paisaje Sonoro', 
    description: 'Utiliza grabaciones de tu entorno.', oa: 'OA 03', 
    deadline: '2023-11-20', status: 'OPEN'
  },
  {
    id: '2', courseId: 'c1', title: 'Podcast: Historia de la Cueca', 
    description: 'Graba un relato de 1 minuto.', oa: 'OA 07', 
    deadline: '2023-10-15', status: 'CLOSED'
  }
];

export const Dashboard: React.FC<DashboardProps> = ({ role, onLaunchStudio }) => {
  const [assignments] = useState(MOCK_ASSIGNMENTS);

  // ROUTE TO TEACHER DASHBOARD IF ROLE IS TEACHER
  if (role === UserRole.TEACHER) {
      return <TeacherDashboard onLaunchStudio={onLaunchStudio} />;
  }

  // --- STUDENT DASHBOARD VIEW ---
  return (
    <div className="max-w-6xl mx-auto p-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-fredoka font-bold text-gray-800">Mi Cuaderno Digital</h2>
          <p className="text-gray-500 font-nunito">Tus tareas y proyectos musicales</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Stats */}
        <div className="col-span-1 space-y-4">
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center">
                <BookOpen className="mr-2 text-blue-500" /> Mis Cursos
              </h3>
              <ul className="space-y-3">
                <li className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                  <span className="font-bold text-blue-800">5° Básico A</span>
                  <span className="bg-white px-2 py-1 rounded text-xs font-bold text-blue-600">Música</span>
                </li>
              </ul>
           </div>
        </div>

        {/* Right Column: Assignments List */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <h3 className="font-bold text-xl text-gray-700 font-fredoka">Tus Tareas</h3>

          {assignments.map((task) => (
            <div key={task.id} className="bg-white p-6 rounded-3xl shadow-md border-b-4 border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:translate-y-[-2px] transition-transform">
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${task.status === 'OPEN' ? 'bg-yellow-400' : 'bg-green-500'}`}>
                    {task.status === 'OPEN' ? 'Pendiente' : 'Entregado'}
                  </span>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                     {task.oa}
                  </span>
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-1">{task.title}</h4>
                <p className="text-gray-500 text-sm mb-4">{task.description}</p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span className="flex items-center"><Clock size={14} className="mr-1"/> Vence: {task.deadline}</span>
                </div>
              </div>

              <div className="flex flex-col space-y-2 w-full md:w-auto">
                <button 
                  onClick={() => onLaunchStudio(task.id)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
                >
                  <FileAudio className="mr-2" /> Ir al Estudio
                </button>
              </div>
            </div>
          ))}
          
          <div className="p-8 border-4 border-dashed border-gray-200 rounded-3xl text-center text-gray-400 font-bold">
             No hay más tareas por ahora. ¡Buen trabajo! 🎵
          </div>

        </div>
      </div>
    </div>
  );
};
