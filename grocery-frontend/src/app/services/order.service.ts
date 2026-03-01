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

  private ordersSubject = new BehaviorSubject<any[]>([]);
  public orders$ = this.ordersSubject.asObservable();

  private isFetching = false;

  constructor(private http: HttpClient) {
    interval(5000).subscribe(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        this.fetchAllOrders();
      }
    });
  }

  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

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

		if (sheetsData.length === 0 && javaData.length > 0) {
			console.warn('⚠️ Google Sheet is empty! Repopulating from Java DB...');
			javaData.forEach((javaItem) => {
				const payload = {
				key: this.apiKey,
				route: 'orders',
				action: 'CREATE',
				data: javaItem,
				};
				this.http
				.post<any>(this.sheetsUrl, JSON.stringify(payload), { headers: this.textHeaders })
				.pipe(catchError(() => of(null)))
				.subscribe();
			});

			this.ordersSubject.next(javaData);
			return;
		}


        const combined = [...javaData, ...sheetsData];
        const uniqueOrders = Array.from(new Map(combined.map((item) => [item.id, item])).values());

        this.ordersSubject.next(uniqueOrders);

        const javaMap = new Map(javaData.map((j) => [j.id, j]));
        const sheetsMap = new Map(sheetsData.map((s) => [s.id, s]));

        sheetsData.forEach((sheetItem) => {
          const javaItem = javaMap.get(sheetItem.id);

          if (!javaItem) {
            this.http
              .post<any>(this.javaUrl, sheetItem)
              .pipe(catchError(() => of(null)))
              .subscribe();
          } else {
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

        javaData.forEach((javaItem) => {
          if (!sheetsMap.has(javaItem.id)) {
            this.http
              .delete<void>(`${this.javaUrl}/${javaItem.id}`)
              .pipe(catchError(() => of(null)))
              .subscribe();
          }
        });
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

    const sheetsPayload = { key: this.apiKey, route: 'orders', action: 'CREATE', data: order };

    const currentOrders = this.ordersSubject.value;
    this.ordersSubject.next([...currentOrders, order]);

    this.http
      .post<any>(this.sheetsUrl, JSON.stringify(sheetsPayload), { headers: this.textHeaders })
      .pipe(catchError(() => of(null)))
      .subscribe();

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

    this.http
      .post<void>(this.sheetsUrl, JSON.stringify(sheetsPayload), { headers: this.textHeaders })
      .pipe(catchError(() => of(null)))
      .subscribe();

    return this.http.delete<void>(`${this.javaUrl}/${id}`).pipe(catchError(() => of(undefined)));
  }
}
