import React, { useState } from 'react';
import { Assignment, UserRole } from '../types';
import { BookOpen, Users, Plus, FileAudio, CheckCircle, Clock } from 'lucide-react';

interface DashboardProps {
  role: UserRole;
  onLaunchStudio: (assignmentId?: string) => void;
}

const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: '1',
    title: 'Creación de Paisaje Sonoro',
    description: 'Utiliza grabaciones de tu entorno y mézclalas con música de fondo.',
    oa: 'MU1M OA 03: Cantar y tocar repertorio diverso.',
    deadline: '2023-11-20',
    status: 'PENDING'
  },
  {
    id: '2',
    title: 'Podcast: Historia de la Cueca',
    description: 'Graba un relato de 1 minuto sobre el origen de la cueca.',
    oa: 'MU1M OA 07: Valorar la música nacional.',
    deadline: '2023-10-15',
    status: 'GRADED',
    grade: 6.5
  }
];

export const Dashboard: React.FC<DashboardProps> = ({ role, onLaunchStudio }) => {
  const [assignments] = useState(MOCK_ASSIGNMENTS);

  return (
    <div className="max-w-6xl mx-auto p-6 animate-fade-in">
      
      {/* Header based on Role */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-fredoka font-bold text-gray-800">
            {role === UserRole.TEACHER ? 'Sala de Profesores' : 'Mi Cuaderno Digital'}
          </h2>
          <p className="text-gray-500 font-nunito">
            {role === UserRole.TEACHER ? 'Gestiona tus cursos y encargos' : 'Tus tareas y proyectos musicales'}
          </p>
        </div>
        
        {role === UserRole.TEACHER && (
          <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center shadow-lg hover:bg-blue-700 transition-all">
            <Plus className="mr-2" /> Crear Nuevo Encargo
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Stats/Menu */}
        <div className="col-span-1 space-y-4">
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center">
                <BookOpen className="mr-2 text-blue-500" /> Cursos Activos
              </h3>
              <ul className="space-y-3">
                <li className="flex justify-between items-center p-3 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100">
                  <span className="font-bold text-blue-800">5° Básico A</span>
                  <span className="bg-white px-2 py-1 rounded text-xs font-bold text-blue-600">30 Alumnos</span>
                </li>
                <li className="flex justify-between items-center p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100">
                  <span className="font-bold text-gray-700">1° Medio B</span>
                  <span className="bg-white px-2 py-1 rounded text-xs font-bold text-gray-600">28 Alumnos</span>
                </li>
              </ul>
           </div>
        </div>

        {/* Right Column: Assignments List */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <h3 className="font-bold text-xl text-gray-700 font-fredoka">
            {role === UserRole.TEACHER ? 'Tareas Recientes' : 'Tus Tareas'}
          </h3>

          {assignments.map((task) => (
            <div key={task.id} className="bg-white p-6 rounded-3xl shadow-md border-b-4 border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:translate-y-[-2px] transition-transform">
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${task.status === 'PENDING' ? 'bg-yellow-400' : 'bg-green-500'}`}>
                    {task.status === 'PENDING' ? 'Pendiente' : task.status === 'GRADED' ? `Nota: ${task.grade}` : 'Entregado'}
                  </span>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                     {task.oa}
                  </span>
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-1">{task.title}</h4>
                <p className="text-gray-500 text-sm mb-4">{task.description}</p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span className="flex items-center"><Clock size={14} className="mr-1"/> Vence: {task.deadline}</span>
                  {role === UserRole.TEACHER && <span className="flex items-center"><Users size={14} className="mr-1"/> 12/30 Entregas</span>}
                </div>
              </div>

              <div className="flex flex-col space-y-2 w-full md:w-auto">
                <button 
                  onClick={() => onLaunchStudio(task.id)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
                >
                  <FileAudio className="mr-2" /> 
                  {role === UserRole.TEACHER ? 'Revisar / Abrir' : 'Ir al Estudio'}
                </button>
                {role === UserRole.TEACHER && (
                  <button className="bg-white border-2 border-gray-200 text-gray-600 px-6 py-2 rounded-xl font-bold text-sm hover:bg-gray-50">
                    Editar Rúbrica
                  </button>
                )}
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