import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin, interval, of } from 'rxjs';
import { map, catchError, finalize, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private javaUrl = `${environment.apiUrl}/products`;
  private sheetsUrl =
    'https://script.google.com/macros/s/AKfycbzAE4pvZ1tug4JO5ANwVZAlg1EnrSqxSNPhd-1_QtnwvEkIm8ahpYKUEPf3gf9wKWGrHw/exec';
  private apiKey = 'grocery_secret_2026';
  private textHeaders = new HttpHeaders({ 'Content-Type': 'text/plain' });

  private productsSubject = new BehaviorSubject<any[]>([]);
  public products$ = this.productsSubject.asObservable();
  private isFetching = false;

  constructor(private http: HttpClient) {
    interval(10000).subscribe(() => {
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

    this.http
      .get<any[]>(this.javaUrl)
      .pipe(
        timeout(8000),
        catchError(() => of([])),
        finalize(() => (this.isFetching = false)),
      )
      .subscribe((javaData) => {
        this.productsSubject.next(javaData);
      });
  }

  getProducts(category?: string, search?: string): Observable<any[]> {
    this.fetchAllProducts();

    return this.products$.pipe(
      map((products) => {
        let filtered = products;
        if (category) {
          filtered = filtered.filter(
            (p) => p.category && p.category.toLowerCase() === category.toLowerCase(),
          );
        }
        if (search) {
          filtered = filtered.filter(
            (p) => p.name && p.name.toLowerCase().includes(search.toLowerCase()),
          );
        }
        return filtered;
      }),
    );
  }

  getProductById(id: string): Observable<any> {
    this.fetchAllProducts();
    return this.products$.pipe(map((products) => products.find((p) => p.id === id)));
  }

  createProduct(product: any): Observable<any> {
    product.id = product.id || this.generateId();

    const currentProducts = this.productsSubject.value;
    this.productsSubject.next([...currentProducts, product]);

    this.http
      .post<any>(this.javaUrl, product)
      .pipe(catchError(() => of(null)))
      .subscribe();

    return of(product);
  }

  updateProduct(id: string, product: any): Observable<any> {
    product.id = id;

    const currentProducts = this.productsSubject.value.map((p) =>
      p.id === id ? { ...p, ...product } : p,
    );
    this.productsSubject.next(currentProducts);

    this.http
      .put<any>(`${this.javaUrl}/${id}`, product)
      .pipe(catchError(() => of(null)))
      .subscribe();

    return of(product);
  }

  deleteProduct(id: string): Observable<void> {
    const currentProducts = this.productsSubject.value.filter((p) => p.id !== id);
    this.productsSubject.next(currentProducts);

    this.http
      .delete<void>(`${this.javaUrl}/${id}`)
      .pipe(catchError(() => of(null)))
      .subscribe();

    return of(undefined);
  }

  syncToGoogleSheets(): Observable<any> {
    const items = this.productsSubject.value;
    if (items.length === 0) return of(null);

    const requests = items.map((item) => {
      const payload = { key: this.apiKey, route: 'products', action: 'CREATE', data: item };
      return this.http
        .post<any>(this.sheetsUrl, JSON.stringify(payload), { headers: this.textHeaders })
        .pipe(catchError(() => of(null)));
    });

    return forkJoin(requests);
  }
}
