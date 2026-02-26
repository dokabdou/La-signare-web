import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { switchMap, takeUntil, catchError } from 'rxjs/operators';
import { Subject, of } from 'rxjs';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
})
export class ProductListComponent implements OnInit, OnDestroy {
  products: any[] = [];

  // Dynamic Arrays for the homepage sections
  newArrivals: any[] = [];
  bestSellers: any[] = [];
  categories: string[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          const search = params.get('search') || '';
          this.products = [];
          this.cdr.detectChanges();

          return this.productService.getProducts('', search).pipe(
            catchError((err) => {
              console.error('Backend error fetching products:', err);
              return of([]);
            }),
          );
        }),
      )
      .subscribe((p) => {
        this.products = p || [];

        // 1. Extract unique categories dynamically
        this.categories = Array.from(
          new Set(this.products.map((item: any) => item.category).filter(Boolean)),
        ).sort((a, b) => a.localeCompare(b));

        // 2. New Arrivals: Simulate newest by reversing the array and taking the first 8
        this.newArrivals = [...this.products].reverse().slice(0, 8);

        // 3. Best Sellers: Exactly one product from each category
        this.bestSellers = [];
        const seenCategories = new Set();
        for (const item of this.products) {
          if (item.category && !seenCategories.has(item.category)) {
            seenCategories.add(item.category);
            this.bestSellers.push(item);
          }
        }

        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goToProduct(id: string) {
    this.router.navigate(['/product', id]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goToCategory(cat: string) {
    this.router.navigate(['/category', cat]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  addToCart(event: Event, product: any): void {
    event.stopPropagation(); // Prevents the card click event from firing
    this.cartService.addToCart(product, 1);
  }
}
