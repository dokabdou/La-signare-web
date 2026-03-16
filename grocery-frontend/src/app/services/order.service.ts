import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin, of, Subscription } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private javaUrl = `${environment.apiUrl}/orders`;

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
    if (!this.currentUser || this.isFetching || this.hasFetched) return;

    this.isFetching = true;

    this.http
      .get<any[]>(this.javaUrl)
      .pipe(
        catchError((err) => {
          console.warn('Failed to fetch orders (Auth Token might be missing/expired):', err.status);
          return of([]);
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
    order.id = id;

    const currentOrders = this.ordersSubject.value.map((o) =>
      o.id === id ? { ...o, ...order } : o,
    );
    this.ordersSubject.next(currentOrders);

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

  syncToGoogleSheets(): Observable<any> {
    const items = this.ordersSubject.value;
    if (items.length === 0) return of(null);

    const requests = items.map((item) => {
      const payload = {
        route: 'orders',
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
