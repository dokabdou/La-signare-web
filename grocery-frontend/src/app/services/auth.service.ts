import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authUrl = `${environment.apiUrl}/auth`;
  private customersUrl = `${environment.apiUrl}/customers`;

  private isBrowser = typeof window !== 'undefined';

  private customersSubject = new BehaviorSubject<any[]>([]);
  public customers$ = this.customersSubject.asObservable();

  private currentUserSubject = new BehaviorSubject<any>(this.loadUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  public showLoginModal$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {}

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

  // This ignores localStorage and asks Java to verify the HttpOnly cookie
  verifyAdminStatus(): Observable<boolean> {
    return this.http.get(`${this.authUrl}/validate-admin`).pipe(
      map(() => true), // If Java returns 200 OK, they are a real admin
      catchError(() => {
        return of(false);
      }),
    );
  }

  openLoginModal() {
    this.showLoginModal$.next(true);
  }

  closeLoginModal() {
    this.showLoginModal$.next(false);
  }

  login(email: string, password: string): Observable<any> {
    // Note: withCredentials: true interceptor manages it but it is checked here
    return this.http.post<any>(`${this.authUrl}/login`, { email, password }).pipe(
      map((response) => {
        if (response && response.user) {
          if (this.isBrowser) {
            localStorage.setItem('currentUser', JSON.stringify(response.user));
          }
          this.currentUserSubject.next(response.user);
          return response.user;
        }
        throw new Error('Invalid response from server');
      }),
    );
  }

  register(user: any): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/register`, user).pipe(
      map((response) => {
        if (response && response.user) {
          if (this.isBrowser) {
            localStorage.setItem('currentUser', JSON.stringify(response.user));
          }
          this.currentUserSubject.next(response.user);
          return response.user;
        }
        return response;
      }),
    );
  }

  updateUser(id: string, updatedData: any): Observable<any> {
    this.http
      .put<any>(`${this.customersUrl}/${id}`, updatedData)
      .pipe(catchError(() => of(null)))
      .subscribe();

    const currentUser = this.currentUserSubject.value;
    if (currentUser && currentUser.id === id) {
      const newUserState = { ...currentUser, ...updatedData };
      if (this.isBrowser) localStorage.setItem('currentUser', JSON.stringify(newUserState));
      this.currentUserSubject.next(newUserState);
    }

    const currentCustomers = this.customersSubject.value.map((c) =>
      c.id === id ? { ...c, ...updatedData } : c,
    );
    this.customersSubject.next(currentCustomers);

    return of(updatedData);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.customersUrl}/customers/${id}`);
  }

  logout() {
    // asks java to destory the HttpOnly cookie
    this.http
      .post(`${this.authUrl}/logout`, {})
      .pipe(
        finalize(() => {
          // clean the browser
          if (this.isBrowser) {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('cart');
            localStorage.removeItem('activeDraftOrderId');
          }
          this.currentUserSubject.next(null);
          this.customersSubject.next([]);
        }),
      )
      .subscribe();
  }

  // Gets the customers securely (needs to be Admin)
  getAllCustomersAdmin(): Observable<any[]> {
    return this.http.get<any[]>(this.customersUrl).pipe(
      tap((data) => {
        this.customersSubject.next(data);
      }),
    );
  }

  syncToGoogleSheets(): Observable<any> {
    const items = this.customersSubject.value;
    if (items.length === 0) return of(null);

    const requests = items.map((item) => {
      const payload = {
        route: 'customers',
        action: 'CREATE',
        data: JSON.stringify(item),
      };

      return this.http
        .post<any>(`${environment.apiUrl}/sync`, payload)
        .pipe(catchError(() => of(null)));
    });

    return forkJoin(requests);
  }
}
