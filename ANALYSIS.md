# PROYECTO: EDUSTUDIO MODULAR (EL "ANTI-BANDLAB" CRIOLLO)

## 1. ANÁLISIS DE BANDLAB FOR EDUCATION (SITUACIÓN ACTUAL)

**El Problema:**
BandLab es una herramienta increíblemente poderosa, pero su paradigma de diseño es skeuomórfico (imita consolas de grabación físicas).
*   **Complejidad Visual:** Faders, envíos, buses y plugins VST intimidan a profesores de música general básica y a niños pequeños.
*   **Curva de Aprendizaje:** Requiere entender flujo de señal.
*   **Gestión:** La parte educativa (LMS) está mezclada con la social, lo que distrae.

**La Solución Propuesta (EduStudio):**
Un DAW "Lego" basado en bloques funcionales que crece con el alumno.
*   **Paradigma:** Construcción por bloques (como Scratch) en lugar de Mezcla de Audio (como ProTools).
*   **Separación:** El "LMS" (Gestión escolar) es una capa separada del "Estudio" (Creación).
*   **Contexto Local:** Alineado al Currículum Nacional Chileno (OAs).

---

## 2. ARQUITECTURA TÉCNICA (PARA GOOGLE AI STUDIO)

**Frontend (La Interfaz):**
*   **Framework:** React 19 (Componentes funcionales).
*   **Estilos:** Tailwind CSS (Diseño atómico y responsivo).
*   **Estado:** Zustand o Context API (Para manejar el estado del DAW sin complejidad excesiva).
*   **Audio Engine:** Tone.js (Wrapper de Web Audio API). Es el motor estándar para síntesis y manejo de tiempo en web.

**Backend & Base de Datos (Sugerido para implementación):**
*   **Plataforma:** Firebase (Google).
    *   *Auth:* Roles (Admin, Profesor, Alumno).
    *   *Firestore:* Base de datos NoSQL en tiempo real (vital para colaboración).
    *   *Storage:* Almacenamiento de archivos de audio (WAV/MP3).
    *   *Functions:* Para procesar audios pesados o llamadas a APIs de IA.

**Integraciones de IA (El "Cerebro"):**
1.  **Google Gemini 1.5 Pro (Vía Vertex AI o Studio API):**
    *   Generación de Letras (Lyrics).
    *   Evaluación automática de textos.
    *   Sugerencias de acordes.
2.  **Suno / Udio (API):** Generación de "Backing Tracks" (Pistas de acompañamiento) personalizadas.
3.  **ElevenLabs:** TTS (Texto a Voz) para narraciones en proyectos de podcast.

---

## 3. REQUERIMIENTOS FUNCIONALES (POR MÓDULOS)

### MÓDULO A: EL DASHBOARD (VISTA PROFESOR)
*   **Gestión de Cursos:** Crear cursos (Ej: "1° Medio B - Música").
*   **Asignaciones con OAs:** Al crear una tarea, el profesor debe poder seleccionar el Objetivo de Aprendizaje (Ej: OA3 - Cantar y tocar repertorio diverso).
*   **Importación:** Botón para importar recursos desde Google Drive.
*   **Centro de Calificaciones:** Vista de tabla con las tareas entregadas, estado (Pendiente/Revisado) y nota.

### MÓDULO B: EL ESTUDIO "LEGO" (VISTA ALUMNO)
*   **Modo Explorador (7-10 años):**
    *   Sin timeline visible al inicio.
    *   Botones gigantes: "Grabar Voz", "Poner Ritmo".
    *   Visualización: Bloques de colores. Volumen = Tamaño del bloque.
*   **Modo Creador (11-14 años):**
    *   Timeline lineal simplificado.
    *   Efectos con Iconos (Cueva, Estadio, Robot) en vez de perillas.
    *   Herramientas de edición básicas (Cortar, Pegar).
*   **Modo Pro (15+ años / Profesor):**
    *   Acceso a parámetros de envolvente (ADSR) y EQ simple.

---

## 4. ESTRUCTURA DE DATOS (EJEMPLO JSON)

```json
{
  "assignment": {
    "id": "tarea_001",
    "title": "Paisaje Sonoro de Chile",
    "description": "Graba sonidos de tu entorno o usa la librería.",
    "oa_mineduc": "OA 03",
    "level": "EXPLORER",
    "resources": ["url_del_audio_base.mp3"],
    "rubric": {
      "creativity": 50,
      "technique": 50
    }
  }
}
```

---

## 5. INSTRUCCIONES PARA IA GENERATIVA

"Actúa como Senior Fullstack Engineer. Utilizando React, Tailwind y Tone.js, implementa el siguiente componente: [DESCRIPCIÓN]. Asegúrate de que la interfaz sea 'Touch-First' (pensada para tablets y dedos, no solo mouse) y que utilice colores de alto contraste para accesibilidad."
