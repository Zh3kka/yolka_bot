import { Injectable } from '@nestjs/common';
import {
  UserSession,
  SessionStep,
  createEmptySession,
} from '../shared/types/session.types';

@Injectable()
export class SessionService {
  private sessions: Map<number, UserSession> = new Map();

  getSession(telegramId: number, username: string): UserSession {
    if (!this.sessions.has(telegramId)) {
      this.sessions.set(telegramId, createEmptySession(telegramId, username));
    }
    return this.sessions.get(telegramId)!;
  }

  updateSession(telegramId: number, updates: Partial<UserSession>): void {
    const session = this.sessions.get(telegramId);
    if (session) {
      Object.assign(session, updates);
    }
  }

  setStep(telegramId: number, step: SessionStep): void {
    this.updateSession(telegramId, { step });
  }

  resetSession(telegramId: number, username: string): void {
    this.sessions.set(telegramId, createEmptySession(telegramId, username));
  }

  deleteSession(telegramId: number): void {
    this.sessions.delete(telegramId);
  }
}

