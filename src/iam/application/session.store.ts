import { computed, Injectable, signal } from '@angular/core';

/** Signed-in user kept between page reloads. */
export interface Session {
  userId: number;
  username: string;
  token: string;
}

const storageKey = 'hostera.session';

/**
 * Application state of the IAM context: the current session and its JWT. It survives
 * reloads through localStorage and is cleared when the user signs out or the API answers 401.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly current = signal<Session | null>(SessionStore.read());

  readonly session = this.current.asReadonly();
  readonly isAuthenticated = computed(() => this.current() !== null);
  readonly token = computed(() => this.current()?.token ?? null);
  readonly username = computed(() => this.current()?.username ?? '');

  /** Stores the session returned by the sign-in endpoint. */
  start(session: Session): void {
    this.current.set(session);
    try {
      localStorage.setItem(storageKey, JSON.stringify(session));
    } catch {
      // Storage can be unavailable (private mode); the session then lasts until reload.
    }
  }

  /** Forgets the session and its token. */
  end(): void {
    this.current.set(null);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Nothing stored.
    }
  }

  private static read(): Session | null {
    try {
      const raw = localStorage.getItem(storageKey);
      const value = raw ? (JSON.parse(raw) as Partial<Session>) : null;
      return value?.token && value.username && typeof value.userId === 'number'
        ? (value as Session)
        : null;
    } catch {
      return null;
    }
  }
}
