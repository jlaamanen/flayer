import { Session } from "./session";

export interface SessionStore {
  get: (sessionId: string) => Session;
  set: (sessionId: string, session: Session) => void;
  destroy: (sessionId: string) => void;
}


export function createSessionStore(): SessionStore {
  const sessionStore = new Map<string, any>();
  return {
    get(sessionId) {
      return sessionStore.get(sessionId)
    },
    set(sessionId, session) {
      sessionStore.set(sessionId, session);
    },
    destroy(sessionId) {
      sessionStore.delete(sessionId)
    },
  } as SessionStore
}
