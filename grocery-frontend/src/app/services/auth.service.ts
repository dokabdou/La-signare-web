import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin, of, interval } from 'rxjs';
import { map, tap, catchError, finalize, timeout } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private javaUrl = 'http://localhost:8080/api/customers';
  private sheetsUrl =
    'https://script.google.com/macros/s/AKfycbzAE4pvZ1tug4JO5ANwVZAlg1EnrSqxSNPhd-1_QtnwvEkIm8ahpYKUEPf3gf9wKWGrHw/exec';
  private apiKey = 'grocery_secret_2026';
  private textHeaders = new HttpHeaders({ 'Content-Type': 'text/plain' });

  private isBrowser = typeof window !== 'undefined';

  private customersSubject = new BehaviorSubject<any[]>([]);
  public customers$ = this.customersSubject.asObservable();

  private currentUserSubject = new BehaviorSubject<any>(this.loadUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  // Triggers the Login Modal to pop up from anywhere in the app
  public showLoginModal$ = new BehaviorSubject<boolean>(false);

  private isFetching = false;

  constructor(private http: HttpClient) {
    interval(3000).subscribe(() => {
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
    return user && (user.admin === true || user.admin === 'TRUE' || user.admin === 'true');
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

    const cacheBuster = new Date().getTime();

    const java$ = this.http.get<any[]>(this.javaUrl).pipe(
      timeout(8000),
      catchError(() => of([])),
    );

    const sheets$ = this.http
      .get<any[]>(`${this.sheetsUrl}?key=${this.apiKey}&route=customers&cb=${cacheBuster}`)
      .pipe(
        timeout(8000),
        catchError(() => of([])),
      );

    forkJoin([java$, sheets$])
      .pipe(finalize(() => (this.isFetching = false)))
      .subscribe(([javaData, sheetsData]) => {
        if (sheetsData.length === 0 && javaData.length > 0) {
          console.warn('⚠️ Google Sheet is empty! Repopulating from Java DB...');
          javaData.forEach((javaItem) => {
            const payload = {
              key: this.apiKey,
              route: 'customers',
              action: 'CREATE',
              data: javaItem,
            };
            this.http
              .post<any>(this.sheetsUrl, JSON.stringify(payload), { headers: this.textHeaders })
              .pipe(catchError(() => of(null)))
              .subscribe();
          });

          this.customersSubject.next(javaData);
          return; 
        }

        const combined = [...javaData, ...sheetsData];
        const uniqueCustomers = Array.from(
          new Map(combined.map((item) => [item.id, item])).values(),
        );

        this.customersSubject.next(uniqueCustomers);

        const javaMap = new Map(javaData.map((j) => [j.id, j]));
        const sheetsMap = new Map(sheetsData.map((s) => [s.id, s]));

        sheetsData.forEach((sheetItem) => {
          const javaItem = javaMap.get(sheetItem.id);

          const sheetAdminStatus =
            sheetItem.admin === true || sheetItem.admin === 'TRUE' || sheetItem.admin === 'true';
          const cleanSheetItem = { ...sheetItem, admin: sheetAdminStatus };

          if (!javaItem) {
            // Exists in Sheets, missing in Java -> Create in Java
            this.http
              .post<any>(this.javaUrl, cleanSheetItem)
              .pipe(catchError(() => of(null)))
              .subscribe();
          } else {
            const javaAdminStatus =
              javaItem.admin === true || javaItem.admin === 'TRUE' || javaItem.admin === 'true';

            // Compare properties to see if Sheets data was edited
            const isDifferent =
              javaItem.name !== sheetItem.name ||
              javaItem.phone !== sheetItem.phone ||
              javaItem.email !== sheetItem.email ||
              javaItem.password !== sheetItem.password ||
              javaAdminStatus !== sheetAdminStatus;

            if (isDifferent) {
              // Exists in both, but Sheets has new edits -> Update Java
              this.http
                .put<any>(`${this.javaUrl}/${sheetItem.id}`, cleanSheetItem)
                .pipe(catchError(() => of(null)))
                .subscribe();
            }
          }
        });

        // Check if user was deleted from Sheets, but still exists in Java
        javaData.forEach((javaItem) => {
          if (!sheetsMap.has(javaItem.id)) {
            this.http
              .delete<void>(`${this.javaUrl}/${javaItem.id}`)
              .pipe(catchError(() => of(null)))
              .subscribe();
          }
        });

        // 3. UPDATE CURRENT USER SESSION (If an admin changes roles in Google Sheets)
        const currentLoggedUser = this.currentUserSubject.value;
        if (currentLoggedUser) {
          const updatedUserFromSync = uniqueCustomers.find((c) => c.id === currentLoggedUser.id);

          if (updatedUserFromSync) {
            updatedUserFromSync.admin =
              updatedUserFromSync.admin === true ||
              updatedUserFromSync.admin === 'TRUE' ||
              updatedUserFromSync.admin === 'true';

            // If details changed, update the active session
            if (JSON.stringify(currentLoggedUser) !== JSON.stringify(updatedUserFromSync)) {
              if (this.isBrowser)
                localStorage.setItem('currentUser', JSON.stringify(updatedUserFromSync));
              this.currentUserSubject.next(updatedUserFromSync);
            }
          } else {
            // User was deleted from Google Sheets completely, log them out.
            this.logout();
          }
        }
      });
  }


  login(email: string, password: string): Observable<any> {
    // Instantly trigger a background sync to ensure data is fresh
    this.fetchAllCustomers();

    return this.http.get<any[]>(this.javaUrl).pipe(
      map((customers) => {
        const user = customers.find((c) => c.email === email && c.password === password);
        if (user) {
          user.admin = user.admin === true || user.admin === 'TRUE' || user.admin === 'true';

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
    user.admin = false; // Default new users to non-admin

    const sheetsPayload = { key: this.apiKey, route: 'customers', action: 'CREATE', data: user };

    const currentCustomers = this.customersSubject.value;
    this.customersSubject.next([...currentCustomers, user]);

    this.http
      .post<any>(this.sheetsUrl, JSON.stringify(sheetsPayload), { headers: this.textHeaders })
      .pipe(catchError(() => of(null)))
      .subscribe();
    this.http
      .post<any>(this.javaUrl, user)
      .pipe(catchError(() => of(null)))
      .subscribe();

    if (this.isBrowser) localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);

    return of(user);
  }

  updateUser(id: string, updatedData: any): Observable<any> {
    const sheetsPayload = {
      key: this.apiKey,
      route: 'customers',
      action: 'UPDATE',
      id: id,
      data: updatedData,
    };

    const currentCustomers = this.customersSubject.value.map((c) =>
      c.id === id ? { ...c, ...updatedData } : c,
    );
    this.customersSubject.next(currentCustomers);

    this.http
      .post<any>(this.sheetsUrl, JSON.stringify(sheetsPayload), { headers: this.textHeaders })
      .pipe(catchError(() => of(null)))
      .subscribe();
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
}
