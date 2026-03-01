import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, of, BehaviorSubject, interval } from 'rxjs';
import { map, catchError, finalize, timeout } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private javaUrl = 'http://localhost:8080/api/products';
  private sheetsUrl =
    'https://script.google.com/macros/s/AKfycbzAE4pvZ1tug4JO5ANwVZAlg1EnrSqxSNPhd-1_QtnwvEkIm8ahpYKUEPf3gf9wKWGrHw/exec';
  private apiKey = 'grocery_secret_2026';

  private textHeaders = new HttpHeaders({ 'Content-Type': 'text/plain' });

  private productsSubject = new BehaviorSubject<any[]>([]);
  public products$ = this.productsSubject.asObservable();

  private isFetching = false;

  constructor(private http: HttpClient) {
    interval(3000).subscribe(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        this.fetchAllProducts();
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

  private fetchAllProducts(): void {
    if (this.isFetching) return;
    this.isFetching = true;

    const cacheBuster = new Date().getTime();

    const java$ = this.http.get<any[]>(this.javaUrl).pipe(
      timeout(8000),
      catchError(() => of([])),
    );

    const sheets$ = this.http
      .get<any[]>(`${this.sheetsUrl}?key=${this.apiKey}&route=products&cb=${cacheBuster}`)
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
				route: 'products',
				action: 'CREATE',
				data: javaItem,
				};
				this.http
				.post<any>(this.sheetsUrl, JSON.stringify(payload), { headers: this.textHeaders })
				.pipe(catchError(() => of(null)))
				.subscribe();
			});

			this.productsSubject.next(javaData);
			return;
		}

        const combined = [...javaData, ...sheetsData];
        const uniqueProducts = Array.from(
          new Map(combined.map((item) => [item.id, item])).values(),
        );

        this.productsSubject.next(uniqueProducts);

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
              javaItem.name !== sheetItem.name ||
              Number(javaItem.price) !== Number(sheetItem.price) ||
              javaItem.category !== sheetItem.category ||
              javaItem.description !== sheetItem.description ||
              javaItem.imageUrl !== sheetItem.imageUrl;

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
            // Deleted from Sheets Master -> Delete from Java
            this.http
              .delete<void>(`${this.javaUrl}/${javaItem.id}`)
              .pipe(catchError(() => of(null)))
              .subscribe();
          }
        });
      });
  }

  getProducts(category?: string, search?: string): Observable<any[]> {
    this.fetchAllProducts();

    return this.products$.pipe(
      map((products) => {
        let filtered = products;
        if (category)
          filtered = filtered.filter(
            (p) => p.category && p.category.toLowerCase() === category.toLowerCase(),
          );
        if (search)
          filtered = filtered.filter(
            (p) => p.name && p.name.toLowerCase().includes(search.toLowerCase()),
          );
        return filtered;
      }),
    );
  }

  getProductById(id: string): Observable<any> {
    this.fetchAllProducts();
    // Prefer Sheets data, fallback to Java data if Sheets hasn't loaded yet
    return this.products$.pipe(map((products) => products.find((p) => p.id === id)));
  }


  createProduct(product: any): Observable<any> {
    product.id = product.id || this.generateId();
    const sheetsPayload = { key: this.apiKey, route: 'products', action: 'CREATE', data: product };

    const currentProducts = this.productsSubject.value;
    this.productsSubject.next([...currentProducts, product]);

    this.http
      .post<any>(this.sheetsUrl, JSON.stringify(sheetsPayload), { headers: this.textHeaders })
      .pipe(catchError(() => of(null)))
      .subscribe();
    this.http
      .post<any>(this.javaUrl, product)
      .pipe(catchError(() => of(null)))
      .subscribe();

    return of(product);
  }

  updateProduct(id: string, product: any): Observable<any> {
    product.id = id;
    const sheetsPayload = {
      key: this.apiKey,
      route: 'products',
      action: 'UPDATE',
      id: id,
      data: product,
    };

    const currentProducts = this.productsSubject.value.map((p) =>
      p.id === id ? { ...p, ...product } : p,
    );
    this.productsSubject.next(currentProducts);

    this.http
      .post<any>(this.sheetsUrl, JSON.stringify(sheetsPayload), { headers: this.textHeaders })
      .pipe(catchError(() => of(null)))
      .subscribe();
    this.http
      .put<any>(`${this.javaUrl}/${id}`, product)
      .pipe(catchError(() => of(null)))
      .subscribe();

    return of(product);
  }

  deleteProduct(id: string): Observable<void> {
    const sheetsPayload = { key: this.apiKey, route: 'products', action: 'DELETE', id: id };

    const currentProducts = this.productsSubject.value.filter((p) => p.id !== id);
    this.productsSubject.next(currentProducts);

    this.http
      .post<void>(this.sheetsUrl, JSON.stringify(sheetsPayload), { headers: this.textHeaders })
      .pipe(catchError(() => of(null)))
      .subscribe();
    this.http
      .delete<void>(`${this.javaUrl}/${id}`)
      .pipe(catchError(() => of(null)))
      .subscribe();

    return of(undefined);
  }
}
