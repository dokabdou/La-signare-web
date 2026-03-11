import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin, interval, of } from 'rxjs';
import { map, catchError, finalize, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private javaUrl = `${environment.apiUrl}/customers`;
  private sheetsUrl =
    'https://script.google.com/macros/s/AKfycbzAE4pvZ1tug4JO5ANwVZAlg1EnrSqxSNPhd-1_QtnwvEkIm8ahpYKUEPf3gf9wKWGrHw/exec';
  private apiKey = 'grocery_secret_2026';
  private textHeaders = new HttpHeaders({ 'Content-Type': 'text/plain' });

  private isBrowser = typeof window !== 'undefined';

  private customersSubject = new BehaviorSubject<any[]>([]);
  public customers$ = this.customersSubject.asObservable();

  private currentUserSubject = new BehaviorSubject<any>(this.loadUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  public showLoginModal$ = new BehaviorSubject<boolean>(false);

  private isFetching = false;

  constructor(private http: HttpClient) {
    interval(10000).subscribe(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        this.fetchAllCustomers();
      }
    });

    if (this.isBrowser) {
      this.fetchAllCustomers();
    }
  }

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

  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private fetchAllCustomers(): void {
    if (this.isFetching) return;
    this.isFetching = true;

    this.http
      .get<any[]>(this.javaUrl)
      .pipe(
        timeout(8000),
        catchError(() => of([])),
        finalize(() => (this.isFetching = false)),
      )
      .subscribe((javaData) => {
        this.customersSubject.next(javaData);

        const currentLoggedUser = this.currentUserSubject.value;
        if (currentLoggedUser) {
          const updatedUserFromSync = javaData.find((c) => c.id === currentLoggedUser.id);

          if (updatedUserFromSync) {
            if (JSON.stringify(currentLoggedUser) !== JSON.stringify(updatedUserFromSync)) {
              if (this.isBrowser) {
                localStorage.setItem('currentUser', JSON.stringify(updatedUserFromSync));
              }
              this.currentUserSubject.next(updatedUserFromSync);
            }
          } else {
            this.logout();
          }
        }
      });
  }

  login(email: string, password: string): Observable<any> {
    this.fetchAllCustomers();

    return this.http.get<any[]>(this.javaUrl).pipe(
      map((customers) => {
        const user = customers.find((c) => c.email === email && c.password === password);
        if (user) {
          if (this.isBrowser) localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
          return user;
        }
        throw new Error('Invalid email or password');
      }),
    );
  }

  register(user: any): Observable<any> {
    user.id = user.id || this.generateId();
    user.admin = false;

    const currentCustomers = this.customersSubject.value;
    this.customersSubject.next([...currentCustomers, user]);

    this.http
      .post<any>(this.javaUrl, user)
      .pipe(catchError(() => of(null)))
      .subscribe();

    if (this.isBrowser) localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);

    return of(user);
  }

  updateUser(id: string, updatedData: any): Observable<any> {
    const currentCustomers = this.customersSubject.value.map((c) =>
      c.id === id ? { ...c, ...updatedData } : c,
    );
    this.customersSubject.next(currentCustomers);

    this.http
      .put<any>(`${this.javaUrl}/${id}`, updatedData)
      .pipe(catchError(() => of(null)))
      .subscribe();

    const currentUser = this.currentUserSubject.value;
    if (currentUser && currentUser.id === id) {
      const newUserState = { ...currentUser, ...updatedData };
      if (this.isBrowser) localStorage.setItem('currentUser', JSON.stringify(newUserState));
      this.currentUserSubject.next(newUserState);
    }

    return of(updatedData);
  }

  logout() {
    if (this.isBrowser) localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  syncToGoogleSheets(): Observable<any> {
    const items = this.customersSubject.value;
    if (items.length === 0) return of(null);

    const requests = items.map((item) => {
      const payload = { key: this.apiKey, route: 'customers', action: 'CREATE', data: item };
      return this.http
        .post<any>(this.sheetsUrl, JSON.stringify(payload), { headers: this.textHeaders })
        .pipe(catchError(() => of(null)));
    });

    return forkJoin(requests);
  }
}
