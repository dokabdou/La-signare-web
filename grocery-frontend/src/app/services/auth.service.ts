import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authUrl = `${environment.apiUrl}/auth`;
  private customersUrl = `${environment.apiUrl}/customers`;

  private sheetsUrl =
    'https://script.google.com/macros/s/AKfycbzAE4pvZ1tug4JO5ANwVZAlg1EnrSqxSNPhd-1_QtnwvEkIm8ahpYKUEPf3gf9wKWGrHw/exec';
  private apiKey = 'grocery_secret_2026';
  //private textHeaders = new HttpHeaders({ 'Content-Type': 'text/plain' });

  private isBrowser = typeof window !== 'undefined';

  // Restored: Caches the customer list ONLY when an Admin requests it
  private customersSubject = new BehaviorSubject<any[]>([]);
  public customers$ = this.customersSubject.asObservable();

  private currentUserSubject = new BehaviorSubject<any>(this.loadUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  public showLoginModal$ = new BehaviorSubject<boolean>(false);

  // Injected the OrderService so we can clear its cache on logout
  constructor(
    private http: HttpClient,
  ) {}

  private loadUser() {
    if (!this.isBrowser) return null;
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user && (user.admin === true || user.admin === 'true');
  }

  openLoginModal() {
    this.showLoginModal$.next(true);
  }

  closeLoginModal() {
    this.showLoginModal$.next(false);
  }

  // --- SECURE LOGIN ---
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/login`, { email, password }).pipe(
      map((response) => {
        if (response && response.token) {
          if (this.isBrowser) {
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            localStorage.setItem('authToken', response.token);
          }
          this.currentUserSubject.next(response.user);
          return response.user;
        }
        throw new Error('Invalid response from server');
      }),
    );
  }

  // --- SECURE REGISTER ---
  register(user: any): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/register`, user).pipe(
      map((response) => {
        if (response && response.token) {
          if (this.isBrowser) {
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            localStorage.setItem('authToken', response.token);
          }
          this.currentUserSubject.next(response.user);
          return response.user;
        }
        throw new Error('Registration failed');
      }),
    );
  }

  // --- RESTORED: UPDATE USER ---
  updateUser(id: string, updatedData: any): Observable<any> {
    // 1. Send update to Java backend
    this.http
      .put<any>(`${this.customersUrl}/${id}`, updatedData)
      .pipe(catchError(() => of(null)))
      .subscribe();

    // 2. Update the currently logged-in user in memory
    const currentUser = this.currentUserSubject.value;
    if (currentUser && currentUser.id === id) {
      const newUserState = { ...currentUser, ...updatedData };
      if (this.isBrowser) localStorage.setItem('currentUser', JSON.stringify(newUserState));
      this.currentUserSubject.next(newUserState);
    }

    // 3. Update the Admin's customer cache if it happens to be loaded
    const currentCustomers = this.customersSubject.value.map((c) =>
      c.id === id ? { ...c, ...updatedData } : c,
    );
    this.customersSubject.next(currentCustomers);

    return of(updatedData);
  }

  // --- SECURE LOGOUT ---
  logout() {
    if (this.isBrowser) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');

	  localStorage.removeItem('cart');
      localStorage.removeItem('activeDraftOrderId');
    }
    this.currentUserSubject.next(null);
    this.customersSubject.next([]); // Clear admin customer cache
  }

  // Gets the customers securely (Requires Admin Token!)
  getAllCustomersAdmin(): Observable<any[]> {
    return this.http.get<any[]>(this.customersUrl).pipe(
      tap((data) => {
        this.customersSubject.next(data); // Fill the cache for the Google Sheets sync
      }),
    );
  }

  // --- RESTORED: GOOGLE SHEETS SYNC ---
  /* syncToGoogleSheets(): Observable<any> {
    const items = this.customersSubject.value;

    // If the cache is empty, we don't have anything to sync
    if (items.length === 0) return of(null);

    const requests = items.map((item) => {
      const payload = { key: this.apiKey, route: 'customers', action: 'CREATE', data: item };
      return this.http
        .post<any>(this.sheetsUrl, JSON.stringify(payload), { headers: this.textHeaders })
        .pipe(catchError(() => of(null)));
    });

    return forkJoin(requests);
  } */

  syncToGoogleSheets(): Observable<any> {
    const items = this.customersSubject.value;
    if (items.length === 0) return of(null);

    const requests = items.map((item) => {
      const body = new URLSearchParams();
      body.set('key', this.apiKey);
      body.set('route', 'customers');
      body.set('action', 'CREATE');
      body.set('data', JSON.stringify(item));

      return this.http
        .post<any>(this.sheetsUrl, body.toString(), {
          headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }),
        })
        .pipe(catchError(() => of(null)));
    });

    return forkJoin(requests);
  }
}
