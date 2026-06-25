import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  authService = inject(AuthService);
  errorMessage: string | null = null;

  async onGoogleLogin() {
    this.errorMessage = null;
    try {
      await this.authService.loginWithGoogle();
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      this.errorMessage = err.message || 'Authentication failed. Please verify your Firebase project setup and credentials.';
    }
  }
}
