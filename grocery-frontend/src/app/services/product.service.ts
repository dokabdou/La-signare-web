import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private javaUrl = `${environment.apiUrl}/products`;

  private productsSubject = new BehaviorSubject<any[]>([]);
  public products$ = this.productsSubject.asObservable();

  private isFetching = false;
  private hasFetched = false; // THE CACHE FLAG

  constructor(private http: HttpClient) {}

  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Only fetches from Java if it hasn't fetched already
  private fetchAllProducts(): void {
    if (this.isFetching || this.hasFetched) return;
    this.isFetching = true;

    this.http
      .get<any[]>(this.javaUrl)
      .pipe(
        catchError(() => of([])),
        finalize(() => (this.isFetching = false)),
      )
      .subscribe((javaData) => {
        this.productsSubject.next(javaData);
        this.hasFetched = true; // Mark as successfully cached!
      });
  }

  // Call this if an Admin adds a product and you want to force a redownload
  public refreshProducts(): void {
    this.hasFetched = false;
    this.fetchAllProducts();
  }

  getProducts(category?: string, search?: string): Observable<any[]> {
    this.fetchAllProducts(); // Triggers the lazy load

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
      const payload = {
        route: 'products',
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
