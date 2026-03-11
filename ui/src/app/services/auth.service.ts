import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface AuthResponse {
  token: string;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  
  private tokenSubject = new BehaviorSubject<string | null>(localStorage.getItem('metube_token'));
  private usernameSubject = new BehaviorSubject<string | null>(localStorage.getItem('metube_username'));

  token$ = this.tokenSubject.asObservable();
  username$ = this.usernameSubject.asObservable();

  constructor() {}

  get token(): string | null {
    return this.tokenSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.token;
  }

  register(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('register', { username, password }).pipe(
      tap(res => this.handleAuth(res))
    );
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('login', { username, password }).pipe(
      tap(res => this.handleAuth(res))
    );
  }

  logout() {
    localStorage.removeItem('metube_token');
    localStorage.removeItem('metube_username');
    this.tokenSubject.next(null);
    this.usernameSubject.next(null);
    // Reload to clear all states and close sockets
    window.location.reload();
  }

  private handleAuth(res: AuthResponse) {
    localStorage.setItem('metube_token', res.token);
    localStorage.setItem('metube_username', res.username);
    this.tokenSubject.next(res.token);
    this.usernameSubject.next(res.username);
    // Reload to ensure all services (especially socket.io) use the new token
    window.location.reload();
  }
}
