import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container" role="main">
      <div class="auth-card">
        <div class="logo" aria-hidden="true">🥗</div>
        <h1>NutriTrack</h1>
        <h2>Ingresar</h2>

        <div *ngIf="inactivityMessage" class="info-msg" role="alert">
          ⏱️ Tu sesión se cerró por inactividad.
        </div>

        <form (ngSubmit)="onSubmit()" aria-label="Formulario de inicio de sesión">
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" type="email" [(ngModel)]="email" name="email" required placeholder="tu@email.com" class="form-input" [disabled]="loading" />
          </div>
          <div class="form-group">
            <label for="password">Contraseña</label>
            <input id="password" type="password" [(ngModel)]="password" name="password" required placeholder="••••••••" class="form-input" [disabled]="loading" />
          </div>
          <div *ngIf="error" class="error-msg" role="alert">{{ error }}</div>
          <button type="submit" class="btn-primary" [disabled]="loading || !email || !password">
            {{ loading ? 'Ingresando...' : 'Ingresar' }}
          </button>
        </form>
        <p class="auth-link">¿No tienes cuenta? <a routerLink="/register">Regístrate aquí</a></p>
        <p class="auth-link"><a routerLink="/forgot-password">¿Olvidaste tu contraseña?</a></p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { min-height:100vh; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#0F2D5E 0%,#1A56B0 100%); padding:1rem; }
    .auth-card { background:white; border-radius:16px; padding:2.5rem 2rem; max-width:400px; width:100%; box-shadow:0 20px 60px rgba(0,0,0,0.2); }
    .logo { font-size:2.5rem; text-align:center; margin-bottom:0.5rem; }
    h1 { font-size:1.5rem; font-weight:700; color:#0F2D5E; margin:0 0 0.25rem; text-align:center; }
    h2 { font-size:1.1rem; font-weight:600; color:#374151; margin:0 0 1.5rem; text-align:center; }
    .form-group { display:flex; flex-direction:column; gap:4px; margin-bottom:1rem; }
    label { font-size:13px; font-weight:600; color:#374151; }
    .form-input { padding:10px 12px; border:1.5px solid #E5E7EB; border-radius:8px; font-size:14px; font-family:inherit; width:100%; box-sizing:border-box; }
    .form-input:focus { outline:none; border-color:#1A56B0; box-shadow:0 0 0 3px rgba(26,86,176,0.1); }
    .form-input:disabled { background:#F9FAFB; cursor:not-allowed; }
    .error-msg { background:#FEE2E2; color:#991B1B; padding:10px 12px; border-radius:8px; font-size:13px; margin-bottom:1rem; }
    .info-msg { background:#EFF6FF; color:#1A56B0; padding:10px 12px; border-radius:8px; font-size:13px; margin-bottom:1rem; border:1px solid #BFDBFE; }
    .btn-primary { width:100%; padding:11px; background:#1A56B0; color:white; border:none; border-radius:8px; font-size:15px; font-weight:600; cursor:pointer; transition:background 0.2s; }
    .btn-primary:hover:not(:disabled) { background:#0F2D5E; }
    .btn-primary:disabled { opacity:0.6; cursor:not-allowed; }
    .auth-link { text-align:center; margin-top:1rem; font-size:13px; color:#6B7280; }
    .auth-link a { color:#1A56B0; text-decoration:none; font-weight:500; }
    .auth-link a:hover { text-decoration:underline; }
  `]
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  email = '';
  password = '';
  loading = false;
  error = '';
  inactivityMessage = false;

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (reason === 'inactivity') this.inactivityMessage = true;
  }

  onSubmit(): void {
    if (!this.email || !this.password) return;
    this.loading = true;
    this.error = '';

    this.auth.login(this.email, this.password).subscribe({
      next: () => { this.router.navigate(['/dashboard']); },
      error: (err) => {
        this.error = err?.error?.message || 'Email o contraseña incorrectos.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
