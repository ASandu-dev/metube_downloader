import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container d-flex justify-content-center align-items-center" style="min-height: 80vh;">
      <div class="card shadow" style="width: 100%; max-width: 400px;">
        <div class="card-body p-4">
          <h2 class="text-center mb-4">{{ isRegistering ? 'Register' : 'Login' }}</h2>
          
          <form (ngSubmit)="onSubmit()">
            <div class="mb-3">
              <label for="username" class="form-label">Username</label>
              <input type="text" class="form-control" id="username" name="username" [(ngModel)]="username" required autocomplete="username">
            </div>
            
            <div class="mb-3">
              <label for="password" class="form-label">Password</label>
              <input type="password" class="form-control" id="password" name="password" [(ngModel)]="password" required autocomplete="current-password">
            </div>
            
            <div *ngIf="error" class="alert alert-danger py-2 small">
              {{ error }}
            </div>
            
            <div class="d-grid gap-2">
              <button type="submit" class="btn btn-primary" [disabled]="loading">
                {{ loading ? 'Processing...' : (isRegistering ? 'Register' : 'Login') }}
              </button>
            </div>
            
            <div class="text-center mt-3">
              <button type="button" class="btn btn-link btn-sm" (click)="toggleMode()">
                {{ isRegistering ? 'Already have an account? Login' : 'Need an account? Register' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class LoginComponent {
  authService = inject(AuthService);
  
  username = '';
  password = '';
  error = '';
  loading = false;
  isRegistering = false;

  toggleMode() {
    this.isRegistering = !this.isRegistering;
    this.error = '';
  }

  onSubmit() {
    if (!this.username || !this.password) {
      this.error = 'Please fill in all fields';
      return;
    }

    this.loading = true;
    this.error = '';

    const authObs = this.isRegistering 
      ? this.authService.register(this.username, this.password)
      : this.authService.login(this.username, this.password);

    authObs.subscribe({
      next: () => {
        this.loading = false;
        // Auth state will update and App component will react
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Authentication failed';
      }
    });
  }
}
