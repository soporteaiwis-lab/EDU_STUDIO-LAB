import { Session, Track } from '../types';

const STORAGE_KEY = 'edustudio_sessions';

export const storageService = {
  getSessions: (): Session[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error loading sessions", e);
      return [];
    }
  },

  saveSession: (session: Session): void => {
    const sessions = storageService.getSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = { ...session, lastModified: Date.now() };
    } else {
      sessions.push({ ...session, lastModified: Date.now() });
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    console.log("Session saved to Local Cloud");
  },

  deleteSession: (id: string): void => {
    const sessions = storageService.getSessions();
    const newSessions = sessions.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
  },

  loadSession: (id: string): Session | undefined => {
    const sessions = storageService.getSessions();
    return sessions.find(s => s.id === id);
  }
};