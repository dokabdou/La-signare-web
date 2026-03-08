import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin, interval, of } from 'rxjs';
import { map, catchError, finalize, timeout } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private javaUrl = 'http://localhost:8080/api/orders';
  private sheetsUrl =
    'https://script.google.com/macros/s/AKfycbzAE4pvZ1tug4JO5ANwVZAlg1EnrSqxSNPhd-1_QtnwvEkIm8ahpYKUEPf3gf9wKWGrHw/exec';
  private apiKey = 'grocery_secret_2026';
  private textHeaders = new HttpHeaders({ 'Content-Type': 'text/plain' });

  private ordersSubject = new BehaviorSubject<any[]>([]);
  public orders$ = this.ordersSubject.asObservable();

  private isFetching = false;

  constructor(private http: HttpClient) {
    interval(3000).subscribe(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        this.fetchAllOrders();
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
        this.ordersSubject.next(javaData);
      });
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

	console.log('Created order:', order);
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

	console.log('Updated order:', order);
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
      const payload = { key: this.apiKey, route: 'orders', action: 'CREATE', data: item };
      return this.http
        .post<any>(this.sheetsUrl, JSON.stringify(payload), { headers: this.textHeaders })
        .pipe(catchError(() => of(null)));
    });

    return forkJoin(requests);
  }
}
