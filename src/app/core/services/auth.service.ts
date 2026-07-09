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
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private firestore = inject(Firestore);

  // Observable for auth state tracking
  user$ = user(this.auth);

  // Angular Signal to hold the current user state reactively
  currentUser = signal<User | null>(null);
  isAdmin = signal<boolean>(false);
  loading = signal<boolean>(true);

  constructor() {
    this.user$.subscribe(async (authUser) => {
      this.currentUser.set(authUser);
      
      if (authUser && authUser.email) {
        const email = authUser.email.toLowerCase();
        
        // 1. Safety fallback for admins
        if (email === 'pakanatijayasri@gmail.com' || email === 'chinthalacheruvuamareswar@gmail.com') {
          this.isAdmin.set(true);
          this.loading.set(false);
          return;
        }

        // 2. Query Firestore admins collection
        try {
          const docRef = doc(this.firestore, `admins/${email}`);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            this.isAdmin.set(true);
          } else {
            // 3. Fallback to check standard dev domain patterns
            this.isAdmin.set(
              email.endsWith('@college-compass.com') ||
              email.startsWith('admin') ||
              email.endsWith('@admin.com')
            );
          }
        } catch (error) {
          console.error('Error fetching admin rules from Firestore:', error);
          this.isAdmin.set(
            email.endsWith('@college-compass.com') ||
            email.startsWith('admin') ||
            email.endsWith('@admin.com')
          );
        }
      } else {
        this.isAdmin.set(false);
      }
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
