import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }

  // Specific methods for authentication tokens
  setToken(token: string): void {
    this.setItem('token', token);
  }

  getToken(): string | null {
    return this.getItem('token');
  }

  removeToken(): void {
    this.removeItem('token');
  }

  // Specific methods for username
  setUsername(username: string): void {
    this.setItem('usuario', username);
  }

  getUsername(): string | null {
    return this.getItem('usuario');
  }

  removeUsername(): void {
    this.removeItem('usuario');
  }

  // Specific methods for userId
  setUserId(userId: string): void {
    this.setItem('userId', userId);
  }

  getUserId(): string | null {
    return this.getItem('userId');
  }

  removeUserId(): void {
    this.removeItem('userId');
  }
}
