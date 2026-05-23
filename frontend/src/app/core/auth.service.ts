import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface AuthResponse {
  success: boolean;
  token?: string;
  userId?: number;
  name?: string;
  email?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:8080/api/auth';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      try {
        this.currentUserSubject.next(JSON.parse(user));
      } catch (e) {
        this.logout();
      }
    }
  }

  register(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, userData).pipe(
      tap(res => {
        if (res.success && res.token) {
          this.setSession(res);
        }
      })
    );
  }

  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap(res => {
        if (res.success && res.token) {
          this.setSession(res);
        }
      })
    );
  }

  private setSession(authResult: AuthResponse) {
    localStorage.setItem('token', authResult.token!);
    const user = {
      userId: authResult.userId,
      name: authResult.name,
      email: authResult.email
    };
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  public get token(): string | null {
    return localStorage.getItem('token');
  }

  public get isLoggedIn(): boolean {
    return !!this.token;
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }
}
