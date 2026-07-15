import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InactivityWarningComponent } from './shared/inactivity-warning.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, InactivityWarningComponent],
  template: `
    <router-outlet></router-outlet>
    <app-inactivity-warning></app-inactivity-warning>
  `
})
export class AppComponent {}
