
import { Session, Track, Course, StudentProfile, Assignment, Rubric, Evaluation } from '../types';

const STORAGE_KEY_SESSIONS = 'edustudio_sessions';
const STORAGE_KEY_COURSES = 'edustudio_courses';
const STORAGE_KEY_ASSIGNMENTS = 'edustudio_assignments';
const STORAGE_KEY_RUBRICS = 'edustudio_rubrics';

// MOCK DATA INITIALIZATION
const MOCK_RUBRIC: Rubric = {
    id: 'rub-1',
    title: 'Rúbrica Ejecución Instrumental (MINEDUC)',
    description: 'Evaluación de desempeño instrumental básico.',
    totalPoints: 12,
    criteria: [
        {
            id: 'c1', name: 'Pulso y Ritmo', weight: 40,
            levels: [
                { label: 'Logrado', points: 4, description: 'Mantiene el pulso constante sin errores.' },
                { label: 'Suficiente', points: 2, description: 'Pierde el pulso ocasionalmente.' },
                { label: 'Por Lograr', points: 0, description: 'No mantiene un pulso estable.' }
            ]
        },
        {
            id: 'c2', name: 'Precisión Melódica', weight: 40,
            levels: [
                { label: 'Logrado', points: 4, description: 'Ejecuta las notas correctas según partitura.' },
                { label: 'Suficiente', points: 2, description: 'Algunos errores de digitación.' },
                { label: 'Por Lograr', points: 0, description: 'Melodía irreconocible.' }
            ]
        },
        {
            id: 'c3', name: 'Fluidez', weight: 20,
            levels: [
                { label: 'Logrado', points: 4, description: 'Ejecución continua sin detenciones.' },
                { label: 'Suficiente', points: 2, description: 'Se detiene para corregir.' },
                { label: 'Por Lograr', points: 0, description: 'Ejecución fragmentada.' }
            ]
        }
    ]
};

const MOCK_COURSES: Course[] = [
    {
        id: 'c-1', name: '5° Básico A', level: 'NB3', color: 'bg-blue-500',
        students: [
            { id: 's1', rut: '23.456.789-1', name: 'Juanito Pérez', email: 'juan@escuela.cl', instrument: 'Flauta' },
            { id: 's2', rut: '23.456.789-2', name: 'María González', email: 'maria@escuela.cl', instrument: 'Teclado' },
            { id: 's3', rut: '23.456.789-3', name: 'Pedro Pascal', email: 'pedro@escuela.cl', instrument: 'Guitarra' },
        ]
    }
];

const MOCK_ASSIGNMENTS: Assignment[] = [
    {
        id: 'a-1', courseId: 'c-1', title: 'Evaluación Repertorio Chileno', 
        description: 'Interpretar "Mira niñita" en instrumento melódico.', oa: 'OA 04', 
        deadline: '2025-04-15', status: 'OPEN', rubricId: 'rub-1',
        evaluations: [
            { studentId: 's1', assignmentId: 'a-1', rubricScores: {'c1':4, 'c2':2, 'c3':4}, totalScore: 10, grade: 5.8, feedback: 'Buen trabajo, mejorar digitación.', status: 'GRADED' }
        ]
    }
];

export const storageService = {
  // --- SESSIONS (EXISTING) ---
  getSessions: (): Session[] => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_SESSIONS) || '[]'); } catch (e) { return []; }
  },
  saveSession: (session: Session): void => {
    const sessions = storageService.getSessions();
    const idx = sessions.findIndex(s => s.id === session.id);
    if (idx >= 0) sessions[idx] = { ...session, lastModified: Date.now() }; else sessions.push({ ...session, lastModified: Date.now() });
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  },
  deleteSession: (id: string): void => {
    const sessions = storageService.getSessions().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  },

  // --- TEACHER: COURSES ---
  getCourses: (): Course[] => {
      const data = localStorage.getItem(STORAGE_KEY_COURSES);
      return data ? JSON.parse(data) : MOCK_COURSES;
  },
  saveCourse: (course: Course) => {
      const courses = storageService.getCourses();
      const idx = courses.findIndex(c => c.id === course.id);
      if (idx >= 0) courses[idx] = course; else courses.push(course);
      localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(courses));
  },
  importStudentsCSV: (courseId: string, csvData: string) => {
      const rows = csvData.split('\n');
      const newStudents: StudentProfile[] = [];
      rows.forEach((row, i) => {
          if(i===0) return; // Skip Header
          const [rut, name, email, inst] = row.split(',');
          if(rut && name) {
              newStudents.push({
                  id: `imp-${Date.now()}-${i}`,
                  rut: rut.trim(), name: name.trim(), email: email?.trim() || '', instrument: inst?.trim()
              });
          }
      });
      const courses = storageService.getCourses();
      const course = courses.find(c => c.id === courseId);
      if(course) {
          course.students = [...course.students, ...newStudents];
          storageService.saveCourse(course);
          return newStudents.length;
      }
      return 0;
  },

  // --- TEACHER: ASSIGNMENTS ---
  getAssignments: (): Assignment[] => {
      const data = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
      return data ? JSON.parse(data) : MOCK_ASSIGNMENTS;
  },
  saveAssignment: (assignment: Assignment) => {
      const items = storageService.getAssignments();
      const idx = items.findIndex(a => a.id === assignment.id);
      if(idx >= 0) items[idx] = assignment; else items.push(assignment);
      localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(items));
  },

  // --- TEACHER: RUBRICS ---
  getRubrics: (): Rubric[] => {
      const data = localStorage.getItem(STORAGE_KEY_RUBRICS);
      return data ? JSON.parse(data) : [MOCK_RUBRIC];
  },
  saveRubric: (rubric: Rubric) => {
      const items = storageService.getRubrics();
      const idx = items.findIndex(r => r.id === rubric.id);
      if(idx >= 0) items[idx] = rubric; else items.push(rubric);
      localStorage.setItem(STORAGE_KEY_RUBRICS, JSON.stringify(items));
  },

  // --- GRADING UTILS (CHILEAN SCALE) ---
  calculateGrade: (score: number, total: number, requirement = 60): number => {
      if (total === 0) return 1.0;
      const percent = (score / total) * 100;
      let grade = 1.0;
      if (percent < requirement) {
          grade = 1.0 + ((percent / requirement) * 3.0);
      } else {
          grade = 4.0 + (((percent - requirement) / (100 - requirement)) * 3.0);
      }
      return parseFloat(Math.min(7.0, Math.max(1.0, grade)).toFixed(1));
  }
};
