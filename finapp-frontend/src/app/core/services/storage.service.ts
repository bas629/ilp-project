import { Injectable } from '@angular/core';

const USER_KEY = 'finapp_user';

@Injectable({ providedIn: 'root' })
export class StorageService {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) as T : null;
    } catch { return null; }
  }

  set(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }

  getUser() {
    return this.get<import('../models/user.model').LoggedInUser>(USER_KEY);
  }

  setUser(user: import('../models/user.model').LoggedInUser): void {
    this.set(USER_KEY, user);
  }

  clearUser(): void {
    this.remove(USER_KEY);
  }
}
