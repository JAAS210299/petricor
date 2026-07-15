import { Injectable, inject, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutos
const WARNING_BEFORE = 60 * 1000; // aviso 1 minuto antes

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  private apiUrl = environment.apiUrl + '/auth';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private inactivityTimer: any = null;
  private warningTimer: any = null;
  public showInactivityWarning$ = new BehaviorSubject<boolean>(false);

  private readonly EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

  constructor() {
    this.checkToken();
  }

  getCurrentUser() { return this.currentUserSubject.value; }

  register(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { email, password });
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<{ accessToken: string; user: any }>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        if (response.accessToken) {
          this.saveToken(response.accessToken);
          this.currentUserSubject.next(response.user);
          this.isAuthenticatedSubject.next(true);
          this.startInactivityTimer();
        }
      })
    );
  }

  verifyEmail(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/verify?token=${token}`);
  }

  logout(reason?: string): void {
    this.stopInactivityTimer();
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.showInactivityWarning$.next(false);
    this.router.navigate(['/login'], reason ? { queryParams: { reason } } : {});
  }

  getMe(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`);
  }

  saveToken(token: string): void { localStorage.setItem('token', token); }
  getToken(): string | null { return localStorage.getItem('token'); }
  isAuthenticated(): boolean { return !!this.getToken(); }

  // ── Inactividad ─────────────────────────────────────────────────────────────
  startInactivityTimer(): void {
    this.stopInactivityTimer();
    this.ngZone.runOutsideAngular(() => {
      this.EVENTS.forEach(e => window.addEventListener(e, this.resetTimer, { passive: true }));
      this.scheduleTimers();
    });
  }

  private scheduleTimers(): void {
    this.warningTimer = setTimeout(() => {
      this.ngZone.run(() => this.showInactivityWarning$.next(true));
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE);

    this.inactivityTimer = setTimeout(() => {
      this.ngZone.run(() => this.logout('inactivity'));
    }, INACTIVITY_TIMEOUT);
  }

  private resetTimer = (): void => {
    clearTimeout(this.inactivityTimer);
    clearTimeout(this.warningTimer);
    this.ngZone.run(() => this.showInactivityWarning$.next(false));
    this.scheduleTimers();
  };

  stopInactivityTimer(): void {
    clearTimeout(this.inactivityTimer);
    clearTimeout(this.warningTimer);
    this.EVENTS.forEach(e => window.removeEventListener(e, this.resetTimer));
  }

  extendSession(): void {
    this.resetTimer();
    this.showInactivityWarning$.next(false);
  }

  private checkToken(): void {
    if (this.isAuthenticated()) {
      this.isAuthenticatedSubject.next(true);
      this.getMe().subscribe({
        next: user => {
          this.currentUserSubject.next(user);
          this.startInactivityTimer();
        },
        error: () => this.logout()
      });
    }
  }
}
