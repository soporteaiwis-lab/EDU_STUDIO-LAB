
import React, { useState, useEffect } from 'react';
import { Course, Assignment, Rubric, UserMode, StudentProfile } from '../types';
import { storageService } from '../services/storageService';
import { 
  Users, BookOpen, Plus, FileSpreadsheet, GraduationCap, 
  ClipboardList, CheckCircle, ChevronRight, Upload, Download,
  Settings, Search, Grid, Layout
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
      if (evalFound) return <span className={`font-bold ${evalFound.grade >= 4.0 ? 'text-blue-600' : 'text-red-500'}`}>{evalFound.grade.toFixed(1)}</span>;
      return <span className="text-gray-400 italic">Pendiente</span>;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 font-nunito animate-fade-in">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
             <div className="bg-orange-100 p-3 rounded-2xl text-orange-600">
                 <GraduationCap size={32} />
             </div>
             <div>
                <h2 className="text-3xl font-fredoka font-bold text-gray-800">Panel Docente</h2>
                <p className="text-gray-500">Gestión Escolar Integral • 2025</p>
             </div>
        </div>
        <div className="flex space-x-2">
            <button onClick={() => onLaunchStudio()} className="bg-gray-800 text-white px-4 py-2 rounded-xl font-bold flex items-center hover:bg-gray-700">
                <Grid size={18} className="mr-2"/> Ir al Estudio
            </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex space-x-2 mb-8 overflow-x-auto pb-2">
          {[
              { id: 'COURSES', icon: Users, label: 'Mis Cursos' },
              { id: 'ASSIGNMENTS', icon: ClipboardList, label: 'Tareas y OAs' },
              { id: 'RUBRICS', icon: CheckCircle, label: 'Rúbricas' },
              { id: 'GRADES', icon: BookOpen, label: 'Libro de Clases' }
          ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-500 hover:bg-gray-50 border border-transparent'}`}
              >
                  <tab.icon size={18} />
                  <span>{tab.label}</span>
              </button>
          ))}
      </div>

      {/* CONTENT AREA */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 min-h-[500px] p-8">
          
          {/* --- COURSES TAB --- */}
          {activeTab === 'COURSES' && (
              <div className="space-y-6">
                  <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold text-gray-700">Gestión de Matrícula</h3>
                      <button className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold flex items-center hover:bg-green-600"><Plus size={18} className="mr-2"/> Nuevo Curso</button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {courses.map(course => (
                          <div key={course.id} className="border-2 border-gray-100 rounded-2xl p-6 hover:border-blue-200 transition-all group">
                              <div className="flex justify-between items-start mb-4">
                                  <div>
                                      <h4 className="text-2xl font-bold text-gray-800">{course.name}</h4>
                                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">{course.students.length} Estudiantes</span>
                                  </div>
                                  <button onClick={() => { setSelectedCourseId(course.id); setShowImportModal(true); }} className="text-gray-400 hover:text-green-600 p-2 bg-gray-50 rounded-lg" title="Importar Alumnos"><FileSpreadsheet size={20}/></button>
                              </div>
                              
                              <div className="bg-gray-50 rounded-xl p-3 h-32 overflow-y-auto mb-4">
                                  {course.students.length === 0 ? <div className="text-xs text-center text-gray-400 mt-10">Sin alumnos inscritos</div> : (
                                      <ul className="space-y-2">
                                          {course.students.map(s => (
                                              <li key={s.id} className="text-xs flex justify-between text-gray-600 border-b border-gray-200 pb-1">
                                                  <span>{s.name}</span>
                                                  <span className="font-mono text-gray-400">{s.rut}</span>
                                              </li>
                                          ))}
                                      </ul>
                                  )}
                              </div>
                              <button className="w-full py-2 bg-blue-50 text-blue-600 font-bold rounded-lg text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">Ver Detalles</button>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* --- RUBRICS TAB --- */}
          {activeTab === 'RUBRICS' && (
              <div className="space-y-6">
                   <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold text-gray-700">Banco de Rúbricas</h3>
                      <button onClick={() => setShowRubricModal(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold flex items-center hover:bg-purple-700"><Plus size={18} className="mr-2"/> Crear Rúbrica</button>
                  </div>

                  <div className="grid gap-4">
                      {rubrics.map(rubric => (
                          <div key={rubric.id} className="border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:shadow-md transition">
                              <div>
                                  <h4 className="font-bold text-lg text-gray-800">{rubric.title}</h4>
                                  <p className="text-sm text-gray-500">{rubric.description}</p>
                                  <div className="flex mt-2 space-x-2">
                                      {rubric.criteria.map(c => (
                                          <span key={c.id} className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-600 border border-gray-200">{c.name}</span>
                                      ))}
                                      <span className="text-[10px] bg-blue-50 px-2 py-1 rounded text-blue-600 font-bold">{rubric.totalPoints} pts</span>
                                  </div>
                              </div>
                              <div className="flex space-x-2">
                                  <button className="p-2 text-gray-400 hover:text-blue-600"><Settings size={18}/></button>
                                  <button className="p-2 text-gray-400 hover:text-red-600"><Upload size={18} className="rotate-180"/></button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* --- GRADES / BOOK TAB --- */}
          {activeTab === 'GRADES' && (
              <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                      <h3 className="text-xl font-bold text-gray-700">Libro de Clases Digital</h3>
                      <div className="flex space-x-2">
                           <select className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-bold text-gray-700 focus:outline-none">
                               {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                           </select>
                           <button className="bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-lg font-bold text-sm flex items-center hover:bg-gray-50"><Download size={16} className="mr-2"/> Exportar Excel</button>
                      </div>
                  </div>

                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                          <thead>
                              <tr className="bg-gray-50 text-gray-600 uppercase tracking-wider text-xs">
                                  <th className="p-4 rounded-l-xl">Estudiante</th>
                                  {assignments.filter(a => a.courseId === (courses[0]?.id || 'c-1')).map(a => (
                                      <th key={a.id} className="p-4 text-center">
                                          <div className="flex flex-col">
                                              <span>{a.title}</span>
                                              <span className="text-[9px] text-gray-400">{a.oa}</span>
                                          </div>
                                      </th>
                                  ))}
                                  <th className="p-4 rounded-r-xl text-center">Promedio</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {(courses[0]?.students || []).map(student => (
                                  <tr key={student.id} className="hover:bg-gray-50 transition">
                                      <td className="p-4 font-bold text-gray-700">
                                          {student.name}
                                          <div className="text-xs text-gray-400 font-normal">{student.rut}</div>
                                      </td>
                                      {assignments.filter(a => a.courseId === (courses[0]?.id || 'c-1')).map(a => (
                                          <td key={a.id} className="p-4 text-center">
                                              {calculateGradeDisplay(student.id, a)}
                                          </td>
                                      ))}
                                      <td className="p-4 text-center font-black text-gray-800">5.8</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}
      </div>

      {/* IMPORT MODAL */}
      {showImportModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl animate-slide-up">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center"><FileSpreadsheet className="mr-2 text-green-600"/> Importación Masiva</h3>
                  <p className="text-sm text-gray-500 mb-4">Copia y pega desde Excel (Formato: RUT, Nombre, Email, Instrumento).</p>
                  
                  <textarea 
                    className="w-full h-40 bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs font-mono mb-4 focus:border-blue-500 focus:outline-none"
                    placeholder={`12.345.678-9, Juan Pérez, juan@mail.com, Guitarra\n23.456.789-0, Ana Silva, ana@mail.com, Voz`}
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                  />
                  
                  <div className="flex justify-end space-x-3">
                      <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancelar</button>
                      <button onClick={handleImportStudents} className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">Procesar Datos</button>
                  </div>
              </div>
          </div>
      )}

      {/* RUBRIC MODAL (SIMPLE) */}
      {showRubricModal && (
           <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl animate-slide-up">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Nueva Rúbrica</h3>
                  <input 
                    type="text" 
                    placeholder="Título (Ej: Evaluación Canto)"
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 mb-4"
                    value={newRubricTitle}
                    onChange={(e) => setNewRubricTitle(e.target.value)}
                  />
                  <div className="flex justify-end space-x-3">
                      <button onClick={() => setShowRubricModal(false)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancelar</button>
                      <button onClick={handleCreateRubric} className="px-6 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700">Crear</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
