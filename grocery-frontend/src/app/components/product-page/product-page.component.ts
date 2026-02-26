import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Observable, of } from 'rxjs';
import { map, switchMap, catchError, tap } from 'rxjs/operators';

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-page.component.html',
  styleUrls: ['./product-page.component.css'],
})
export class ProductPageComponent implements OnInit {
  product$!: Observable<any>;
  relatedProducts$!: Observable<any[]>;
  qty = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cart: CartService,
  ) {}

  ngOnInit(): void {
    this.product$ = this.route.paramMap.pipe(
      map((params) => params.get('id')),
      switchMap((id) => {
        if (!id) return of(null);
        return this.productService.getProductById(id).pipe(
          catchError((err) => {
            console.error('Failed to load product:', err);
            return of(null);
          }),
        );
      }),
      tap(() => (this.qty = 1)), 
    );

    this.relatedProducts$ = this.product$.pipe(
      switchMap((product) => {
        if (!product) return of([]);

        return this.productService.getProducts().pipe(
          map((allProducts) => {
            if (!allProducts) return [];

            const others = allProducts.filter((p: any) => p.id !== product.id);
            let related = others.filter((p: any) => p.category === product.category);

            if (related.length === 0) {
              related = [...others].sort(() => 0.5 - Math.random());
            }

            return related.slice(0, 8);
          }),
          catchError(() => of([])),
        );
      }),
    );
  }

  goToProduct(id: string) {
    this.router.navigate(['/product', id]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  inc() {
    this.qty++;
  }

  dec() {
    if (this.qty > 1) this.qty--;
  }

  addToCart(product: any) {
    if (!product) return;
    this.cart.addToCart(product, this.qty);
    this.qty = 1;
  }
}
