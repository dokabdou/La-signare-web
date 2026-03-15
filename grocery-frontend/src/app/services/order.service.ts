import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin, of, Subscription } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Make sure this path is correct for your project!
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private javaUrl = `${environment.apiUrl}/orders`;
  private sheetsUrl =
    'https://script.google.com/macros/s/AKfycbzAE4pvZ1tug4JO5ANwVZAlg1EnrSqxSNPhd-1_QtnwvEkIm8ahpYKUEPf3gf9wKWGrHw/exec';
  private apiKey = 'grocery_secret_2026';

  private ordersSubject = new BehaviorSubject<any[]>([]);
  public orders$ = this.ordersSubject.asObservable();

  private isFetching = false;
  private hasFetched = false;

  // need to know if someone is actually logged in before fetching!
  private currentUser: any = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {
    // Listen to the auth state. If they log out, wipe the orders.
    // If they log in, we now have permission to fetch!
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      if (!user) {
        this.clearCache();
      }
    });
  }

  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private fetchAllOrders(): void {
    // ONLY fetch if we have a logged-in user, we aren't currently fetching, and haven't fetched yet
    if (!this.currentUser || this.isFetching || this.hasFetched) return;

    this.isFetching = true;

    this.http
      .get<any[]>(this.javaUrl)
      .pipe(
        catchError((err) => {
          console.warn('Failed to fetch orders (Auth Token might be missing/expired):', err.status);
          return of([]); // Silently fail and return empty array
        }),
        finalize(() => (this.isFetching = false)),
      )
      .subscribe((javaData) => {
        this.ordersSubject.next(javaData);
        this.hasFetched = true;
      });
  }

  public refreshOrders(): void {
    this.hasFetched = false;
    this.fetchAllOrders();
  }

  public clearCache(): void {
    this.ordersSubject.next([]);
    this.hasFetched = false;
  }

  getOrders(): Observable<any[]> {
    this.fetchAllOrders();
    return this.orders$;
  }

  getOrderById(id: string): Observable<any> {
    this.fetchAllOrders();
    return this.orders$.pipe(map((orders) => orders.find((o) => o.id === id)));
  }

  createOrder(order: any): Observable<any> {
    order.id = order.id || this.generateId();
    order.createdAt = order.createdAt || new Date().toISOString();
    order.status = 'UnProcessed';

    const currentOrders = this.ordersSubject.value;
    this.ordersSubject.next([...currentOrders, order]);

    this.http
      .post<any>(this.javaUrl, order)
      .pipe(catchError(() => of(null)))
      .subscribe();

    return of(order);
  }

  updateOrder(id: string, order: any): Observable<any> {
	console.log('udpateOrder');
    order.id = id;

    const currentOrders = this.ordersSubject.value.map((o) =>
      o.id === id ? { ...o, ...order } : o,
    );
    this.ordersSubject.next(currentOrders);

	console.log('order : ', order);

    this.http
      .put<any>(`${this.javaUrl}/${id}`, order)
      .pipe(catchError(() => of(null)))
      .subscribe();

    return of(order);
  }

  deleteOrder(id: string): Observable<void> {
    const currentOrders = this.ordersSubject.value.filter((o) => o.id !== id);
    this.ordersSubject.next(currentOrders);

    this.http
      .delete<void>(`${this.javaUrl}/${id}`)
      .pipe(catchError(() => of(null)))
      .subscribe();

    return of(undefined);
  }

  /* syncToGoogleSheets(): Observable<any> {
    const items = this.ordersSubject.value;
    if (items.length === 0) return of(null);

    const requests = items.map((item) => {
      const payload = { key: this.apiKey, route: 'orders', action: 'CREATE', data: item };
      return this.http
        .post<any>(this.sheetsUrl, JSON.stringify(payload), { headers: this.textHeaders })
        .pipe(catchError(() => of(null)));
    });

    return forkJoin(requests);
  } */

  syncToGoogleSheets(): Observable<any> {
    const items = this.ordersSubject.value;
    if (items.length === 0) return of(null);

    const requests = items.map((item) => {
      const body = new URLSearchParams();
      body.set('key', this.apiKey);
      body.set('route', 'orders');
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
