import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-inactivity-warning',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="show$ | async" class="overlay" role="dialog" aria-modal="true" aria-label="Aviso de inactividad">
      <div class="modal">
        <div class="icon" aria-hidden="true">⏱️</div>
        <h2>¿Sigues ahí?</h2>
        <p>Tu sesión se cerrará en <strong>1 minuto</strong> por inactividad.</p>
        <div class="actions">
          <button class="btn-primary" (click)="extend()" aria-label="Continuar sesión">
            Continuar sesión
          </button>
          <button class="btn-secondary" (click)="logout()" aria-label="Cerrar sesión ahora">
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position:fixed; inset:0; background:rgba(0,0,0,0.5);
      display:flex; align-items:center; justify-content:center;
      z-index:1000; animation:fadeIn 0.2s ease;
    }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    .modal {
      background:white; border-radius:16px; padding:2rem;
      max-width:380px; width:90%; text-align:center;
      box-shadow:0 20px 60px rgba(0,0,0,0.3);
      animation:slideUp 0.2s ease;
    }
    @keyframes slideUp { from { transform:translateY(20px); opacity:0; } to { transform:translateY(0); opacity:1; } }
    .icon { font-size:3rem; margin-bottom:0.5rem; }
    h2 { font-size:1.25rem; font-weight:700; color:#0F2D5E; margin:0 0 0.5rem; }
    p { font-size:14px; color:#6B7280; margin:0 0 1.5rem; line-height:1.6; }
    .actions { display:flex; flex-direction:column; gap:10px; }
    .btn-primary { background:#1A56B0; color:white; border:none; padding:12px; border-radius:8px; font-size:15px; font-weight:600; cursor:pointer; transition:background 0.2s; }
    .btn-primary:hover { background:#0F2D5E; }
    .btn-secondary { background:#F3F4F6; color:#374151; border:none; padding:12px; border-radius:8px; font-size:14px; cursor:pointer; }
    .btn-secondary:hover { background:#E5E7EB; }
  `]
})
export class InactivityWarningComponent {
  private auth = inject(AuthService);
  show$ = this.auth.showInactivityWarning$;

  extend(): void { this.auth.extendSession(); }
  logout(): void { this.auth.logout(); }
}
