
import React, { useState, useEffect } from 'react';
import { Course, Assignment, Rubric, UserMode, StudentProfile } from '../types';
import { storageService } from '../services/storageService';
import { 
  Users, BookOpen, Plus, FileSpreadsheet, GraduationCap, 
  ClipboardList, CheckCircle, ChevronRight, Upload, Download,
  Settings, Search, Grid, Layout, Sparkles, BarChart3
} from 'lucide-react';

interface TeacherDashboardProps {
  onLaunchStudio: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onLaunchStudio }) => {
  const [activeTab, setActiveTab] = useState<'COURSES' | 'ASSIGNMENTS' | 'RUBRICS' | 'GRADES'>('COURSES');
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  
  // Modals / Forms State
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [csvContent, setCsvContent] = useState('');
  
  const [showRubricModal, setShowRubricModal] = useState(false);
  const [newRubricTitle, setNewRubricTitle] = useState('');

  // Grading State
  const [gradingAssignmentId, setGradingAssignmentId] = useState<string | null>(null);
  const [gradingStudentId, setGradingStudentId] = useState<string | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
      setCourses(storageService.getCourses());
      setAssignments(storageService.getAssignments());
      setRubrics(storageService.getRubrics());
  };

  const handleImportStudents = () => {
      if(selectedCourseId && csvContent) {
          const count = storageService.importStudentsCSV(selectedCourseId, csvContent);
          alert(`${count} alumnos importados correctamente.`);
          setShowImportModal(false);
          setCsvContent('');
          refreshData();
      }
  };

  const handleCreateRubric = () => {
      const newRubric: Rubric = {
          id: `rub-${Date.now()}`,
          title: newRubricTitle || 'Nueva Rúbrica',
          description: 'Rúbrica personalizada',
          totalPoints: 12,
          criteria: [
              { id: 'c1', name: 'Criterio 1', weight: 100, levels: [{ label: 'Logrado', points: 4, description: '' }, { label: 'No Logrado', points: 1, description: '' }] }
          ]
      };
      storageService.saveRubric(newRubric);
      setShowRubricModal(false);
      refreshData();
  };

  const calculateGradeDisplay = (studentId: string, assignment: Assignment) => {
      const evalFound = assignment.evaluations?.find(e => e.studentId === studentId);
      if (evalFound) return <span className={`font-bold ${evalFound.grade >= 4.0 ? 'text-blue-400' : 'text-red-400'}`}>{evalFound.grade.toFixed(1)}</span>;
      return <span className="text-gray-500 italic text-xs">Pendiente</span>;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 font-nunito animate-fade-in text-gray-200">
      
      {/* HERO SECTION */}
      <div className="relative mb-10 rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 group">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
          
          <div className="relative p-10 flex justify-between items-end">
             <div>
                <h2 className="text-5xl font-brand font-black text-white mb-2">Panel Docente</h2>
                <p className="text-lg text-gray-300 max-w-lg font-light">
                   Gestiona el talento del futuro. Revisa métricas, asigna proyectos y evalúa con precisión.
                </p>
             </div>
             <button 
                onClick={() => onLaunchStudio()} 
                className="bg-white text-black px-6 py-3 rounded-full font-bold flex items-center hover:bg-cyan-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
             >
                <Grid size={18} className="mr-2"/> Abrir Estudio
            </button>
          </div>
      </div>

      {/* TABS (PILLS) */}
      <div className="flex space-x-4 mb-8 overflow-x-auto pb-2 px-1">
          {[
              { id: 'COURSES', icon: Users, label: 'Cursos' },
              { id: 'ASSIGNMENTS', icon: ClipboardList, label: 'Tareas' },
              { id: 'RUBRICS', icon: CheckCircle, label: 'Rúbricas' },
              { id: 'GRADES', icon: BarChart3, label: 'Calificaciones' }
          ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full font-bold transition-all border border-transparent ${activeTab === tab.id ? 'bg-white/10 text-white border-white/20 backdrop-blur shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              >
                  <tab.icon size={18} />
                  <span>{tab.label}</span>
              </button>
          ))}
      </div>

      {/* CONTENT AREA */}
      <div className="min-h-[500px]">
          
          {/* --- COURSES TAB --- */}
          {activeTab === 'COURSES' && (
              <div className="space-y-6 animate-slide-up">
                  <div className="flex justify-between items-center px-2">
                      <h3 className="text-2xl font-brand font-bold text-white">Matrícula Activa</h3>
                      <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-2 rounded-full font-bold flex items-center shadow-lg hover:shadow-green-500/20"><Plus size={18} className="mr-2"/> Nuevo Curso</button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {courses.map(course => (
                          <div key={course.id} className="glass-card rounded-[1.5rem] p-6 group">
                              <div className="flex justify-between items-start mb-6">
                                  <div>
                                      <h4 className="text-3xl font-brand font-black text-white mb-1 group-hover:text-cyan-400 transition-colors">{course.name}</h4>
                                      <span className="bg-white/10 text-gray-300 text-xs font-bold px-3 py-1 rounded-full">{course.students.length} Estudiantes</span>
                                  </div>
                                  <button onClick={() => { setSelectedCourseId(course.id); setShowImportModal(true); }} className="text-gray-400 hover:text-green-400 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors" title="Importar Alumnos"><FileSpreadsheet size={20}/></button>
                              </div>
                              
                              <div className="bg-black/40 rounded-xl p-4 h-32 overflow-y-auto mb-6 custom-scrollbar border border-white/5">
                                  {course.students.length === 0 ? <div className="text-xs text-center text-gray-600 mt-10">Sin alumnos inscritos</div> : (
                                      <ul className="space-y-2">
                                          {course.students.map(s => (
                                              <li key={s.id} className="text-xs flex justify-between text-gray-400 border-b border-white/5 pb-2">
                                                  <span>{s.name}</span>
                                                  <span className="font-mono text-gray-600">{s.rut}</span>
                                              </li>
                                          ))}
                                      </ul>
                                  )}
                              </div>
                              <button className="w-full py-3 bg-white/5 text-gray-300 font-bold rounded-xl text-sm group-hover:bg-white group-hover:text-black transition-colors">Administrar Curso</button>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* --- RUBRICS TAB --- */}
          {activeTab === 'RUBRICS' && (
              <div className="space-y-6 animate-slide-up">
                   <div className="flex justify-between items-center px-2">
                      <h3 className="text-2xl font-brand font-bold text-white">Banco de Rúbricas</h3>
                      <button onClick={() => setShowRubricModal(true)} className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-5 py-2 rounded-full font-bold flex items-center shadow-lg hover:shadow-purple-500/20"><Plus size={18} className="mr-2"/> Crear Rúbrica</button>
                  </div>

                  <div className="grid gap-4">
                      {rubrics.map(rubric => (
                          <div key={rubric.id} className="glass-card rounded-2xl p-5 flex justify-between items-center">
                              <div>
                                  <h4 className="font-bold text-xl text-white mb-1">{rubric.title}</h4>
                                  <p className="text-sm text-gray-400 mb-3">{rubric.description}</p>
                                  <div className="flex gap-2">
                                      {rubric.criteria.map(c => (
                                          <span key={c.id} className="text-[10px] bg-white/5 px-2 py-1 rounded text-gray-400 border border-white/10 uppercase tracking-wide">{c.name}</span>
                                      ))}
                                      <span className="text-[10px] bg-cyan-500/10 px-2 py-1 rounded text-cyan-400 border border-cyan-500/20 font-bold">{rubric.totalPoints} pts</span>
                                  </div>
                              </div>
                              <div className="flex gap-2">
                                  <button className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg hover:bg-white/10 transition"><Settings size={18}/></button>
                                  <button className="p-2 text-gray-400 hover:text-red-400 bg-white/5 rounded-lg hover:bg-white/10 transition"><Upload size={18} className="rotate-180"/></button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* --- GRADES / BOOK TAB --- */}
          {activeTab === 'GRADES' && (
              <div className="space-y-6 animate-slide-up">
                  <div className="glass-panel p-6 rounded-2xl">
                    <div className="flex justify-between items-center border-b border-white/10 pb-6 mb-6">
                        <h3 className="text-2xl font-brand font-bold text-white">Libro de Clases Digital</h3>
                        <div className="flex space-x-3">
                            <select className="bg-black text-white border border-white/20 rounded-lg p-2 text-sm font-bold focus:outline-none focus:border-cyan-500">
                                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <button className="bg-white/10 border border-white/10 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center hover:bg-white/20"><Download size={16} className="mr-2"/> Exportar</button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-gray-500 uppercase tracking-wider text-xs border-b border-white/10">
                                    <th className="p-4">Estudiante</th>
                                    {assignments.filter(a => a.courseId === (courses[0]?.id || 'c-1')).map(a => (
                                        <th key={a.id} className="p-4 text-center">
                                            <div className="flex flex-col">
                                                <span className="text-white">{a.title}</span>
                                                <span className="text-[9px] text-cyan-500 mt-1">{a.oa}</span>
                                            </div>
                                        </th>
                                    ))}
                                    <th className="p-4 text-center text-white">Promedio</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {(courses[0]?.students || []).map(student => (
                                    <tr key={student.id} className="hover:bg-white/5 transition">
                                        <td className="p-4 font-bold text-gray-200">
                                            {student.name}
                                            <div className="text-xs text-gray-500 font-normal font-mono mt-1">{student.rut}</div>
                                        </td>
                                        {assignments.filter(a => a.courseId === (courses[0]?.id || 'c-1')).map(a => (
                                            <td key={a.id} className="p-4 text-center">
                                                {calculateGradeDisplay(student.id, a)}
                                            </td>
                                        ))}
                                        <td className="p-4 text-center font-black text-cyan-400 text-lg">5.8</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                  </div>
              </div>
          )}
      </div>

      {/* IMPORT MODAL */}
      {showImportModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-[#101014] border border-white/10 p-8 rounded-[2rem] w-full max-w-lg shadow-2xl animate-slide-up relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                  
                  <h3 className="text-2xl font-brand font-bold text-white mb-4 flex items-center"><FileSpreadsheet className="mr-2 text-green-500"/> Importación Masiva</h3>
                  <p className="text-sm text-gray-400 mb-6">Copia y pega desde Excel (Formato: RUT, Nombre, Email, Instrumento).</p>
                  
                  <textarea 
                    className="w-full h-40 bg-black border border-white/10 rounded-xl p-4 text-xs font-mono mb-6 focus:border-green-500 focus:outline-none text-gray-300"
                    placeholder={`12.345.678-9, Juan Pérez, juan@mail.com, Guitarra\n23.456.789-0, Ana Silva, ana@mail.com, Voz`}
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                  />
                  
                  <div className="flex justify-end space-x-3">
                      <button onClick={() => setShowImportModal(false)} className="px-5 py-2 text-gray-400 font-bold hover:text-white transition-colors">Cancelar</button>
                      <button onClick={handleImportStudents} className="px-6 py-2 bg-green-600 text-white font-bold rounded-full hover:bg-green-500 shadow-lg shadow-green-900/20">Procesar Datos</button>
                  </div>
              </div>
          </div>
      )}

      {/* RUBRIC MODAL (SIMPLE) */}
      {showRubricModal && (
           <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-[#101014] border border-white/10 p-8 rounded-[2rem] w-full max-w-md shadow-2xl animate-slide-up relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                  <h3 className="text-2xl font-brand font-bold text-white mb-6">Nueva Rúbrica</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Título de la Evaluación</label>
                          <input 
                            type="text" 
                            placeholder="Ej: Evaluación Canto"
                            className="w-full p-3 bg-black rounded-xl border border-white/10 text-white focus:border-purple-500 focus:outline-none"
                            value={newRubricTitle}
                            onChange={(e) => setNewRubricTitle(e.target.value)}
                          />
                      </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-8">
                      <button onClick={() => setShowRubricModal(false)} className="px-5 py-2 text-gray-400 font-bold hover:text-white transition-colors">Cancelar</button>
                      <button onClick={handleCreateRubric} className="px-6 py-2 bg-purple-600 text-white font-bold rounded-full hover:bg-purple-500 shadow-lg shadow-purple-900/20">Crear Rúbrica</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
