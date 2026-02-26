import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, of, BehaviorSubject, interval } from 'rxjs';
import { map, catchError, finalize, timeout } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private javaUrl = 'http://localhost:8080/api/orders';
  private sheetsUrl =
    'https://script.google.com/macros/s/AKfycbzAE4pvZ1tug4JO5ANwVZAlg1EnrSqxSNPhd-1_QtnwvEkIm8ahpYKUEPf3gf9wKWGrHw/exec';
  private apiKey = 'grocery_secret_2026';

  private textHeaders = new HttpHeaders({ 'Content-Type': 'text/plain' });

  // REACTIVE STATE CACHE
  private ordersSubject = new BehaviorSubject<any[]>([]);
  public orders$ = this.ordersSubject.asObservable();

  private isFetching = false;

  constructor(private http: HttpClient) {
    // START BACKGROUND POLLING: Check for new/updated orders every 15 seconds
    interval(5000).subscribe(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        this.fetchAllOrders();
      }
    });
  }

  // Generates a standard UUID v4 in the frontend
  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // --- FETCH DATA IN THE BACKGROUND ---
  private fetchAllOrders(): void {
    if (this.isFetching) return;
    this.isFetching = true;

    const cacheBuster = new Date().getTime();

    const java$ = this.http.get<any[]>(this.javaUrl).pipe(
      timeout(8000),
      catchError(() => of([])),
    );

    const sheets$ = this.http
      .get<any[]>(`${this.sheetsUrl}?key=${this.apiKey}&route=orders&cb=${cacheBuster}`)
      .pipe(
        timeout(8000),
        catchError(() => of([])),
      );

    forkJoin([java$, sheets$])
      .pipe(finalize(() => (this.isFetching = false)))
      .subscribe(([javaData, sheetsData]) => {
        // 1. COMBINE DATA (Sheets is placed LAST so it OVERWRITES Java on duplicate IDs)
        const combined = [...javaData, ...sheetsData];
        const uniqueOrders = Array.from(new Map(combined.map((item) => [item.id, item])).values());

        // Instantly update UI with the prioritized Sheets data
        this.ordersSubject.next(uniqueOrders);

        // 2. AUTO-SYNC: Make Java backend match the Sheets Master Data
        const javaMap = new Map(javaData.map((j) => [j.id, j]));
        const sheetsMap = new Map(sheetsData.map((s) => [s.id, s]));

        sheetsData.forEach((sheetItem) => {
          const javaItem = javaMap.get(sheetItem.id);

          if (!javaItem) {
            // Exists in Sheets, missing in Java -> Create in Java
            this.http
              .post<any>(this.javaUrl, sheetItem)
              .pipe(catchError(() => of(null)))
              .subscribe();
          } else {
            // Check if order totals or customer names were updated in Sheets
            const isDifferent =
              javaItem.total !== sheetItem.total ||
              javaItem.customerName !== sheetItem.customerName;

            if (isDifferent) {
              this.http
                .put<any>(`${this.javaUrl}/${sheetItem.id}`, sheetItem)
                .pipe(catchError(() => of(null)))
                .subscribe();
            }
          }
        });

        // Check if item was deleted from Sheets, but still exists in Java
        javaData.forEach((javaItem) => {
          if (!sheetsMap.has(javaItem.id)) {
            // Deleted from Sheets Master -> Delete from Java
            this.http
              .delete<void>(`${this.javaUrl}/${javaItem.id}`)
              .pipe(catchError(() => of(null)))
              .subscribe();
          }
        });
      });
  }

  // --- READS ---
  getOrders(): Observable<any[]> {
    this.fetchAllOrders();
    return this.orders$;
  }

  getOrderById(id: string): Observable<any> {
    this.fetchAllOrders();
    return this.orders$.pipe(map((orders) => orders.find((o) => o.id === id)));
  }

  // --- WRITES: Optimistic UI Updates ---

  createOrder(order: any): Observable<any> {
    order.id = order.id || this.generateId();
    // Ensure both databases get the exact same timestamp
    order.createdAt = order.createdAt || new Date().toISOString();

    const sheetsPayload = { key: this.apiKey, route: 'orders', action: 'CREATE', data: order };

    // 1. Optimistic Update (UI updates instantly!)
    const currentOrders = this.ordersSubject.value;
    this.ordersSubject.next([...currentOrders, order]);

    // 2. Fire & Forget to Sheets (Doesn't block the UI)
    this.http
      .post<any>(this.sheetsUrl, JSON.stringify(sheetsPayload), { headers: this.textHeaders })
      .pipe(catchError(() => of(null)))
      .subscribe();

    // 3. Return the fast Java response immediately to the Checkout Component
    return this.http.post<any>(this.javaUrl, order).pipe(catchError(() => of(order)));
  }

  updateOrder(id: string, order: any): Observable<any> {
    order.id = id;
    const sheetsPayload = {
      key: this.apiKey,
      route: 'orders',
      action: 'UPDATE',
      id: id,
      data: order,
    };

    const currentOrders = this.ordersSubject.value.map((o) =>
      o.id === id ? { ...o, ...order } : o,
    );
    this.ordersSubject.next(currentOrders);

    // Fire & Forget
    this.http
      .post<any>(this.sheetsUrl, JSON.stringify(sheetsPayload), { headers: this.textHeaders })
      .pipe(catchError(() => of(null)))
      .subscribe();

    return this.http.put<any>(`${this.javaUrl}/${id}`, order).pipe(catchError(() => of(order)));
  }

  deleteOrder(id: string): Observable<void> {
    const sheetsPayload = { key: this.apiKey, route: 'orders', action: 'DELETE', id: id };

    const currentOrders = this.ordersSubject.value.filter((o) => o.id !== id);
    this.ordersSubject.next(currentOrders);

    // Fire & Forget
    this.http
      .post<void>(this.sheetsUrl, JSON.stringify(sheetsPayload), { headers: this.textHeaders })
      .pipe(catchError(() => of(null)))
      .subscribe();

    return this.http.delete<void>(`${this.javaUrl}/${id}`).pipe(catchError(() => of(undefined)));
  }
}
