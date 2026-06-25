import { Injectable, inject, signal } from '@angular/core';
import { 
  Auth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  user, 
  User 
} from '@angular/fire/auth';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);

  // Observable for auth state tracking
  user$ = user(this.auth);

  // Angular Signal to hold the current user state reactively
  currentUser = signal<User | null>(null);
  loading = signal<boolean>(true);

  constructor() {
    this.user$.subscribe((authUser) => {
      this.currentUser.set(authUser);
      this.loading.set(false);
    });
  }

  /**
   * Triggers Google Sign-In flow via popup
   */
  async loginWithGoogle(): Promise<void> {
    this.loading.set(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(this.auth, provider);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Google Login Failed:', error);
      this.loading.set(false);
      throw error;
    }
  }

  /**
   * Signs the user out and redirects to login
   */
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Sign Out Failed:', error);
    }
  }

  /**
   * Checks if user is authenticated programmatically
   */
  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }
}
