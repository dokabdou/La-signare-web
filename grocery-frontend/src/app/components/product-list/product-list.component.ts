import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { switchMap, takeUntil, catchError } from 'rxjs/operators';
import { Subject, of } from 'rxjs';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css', '../../../styles.css'],
})
export class ProductListComponent implements OnInit, OnDestroy {
  products: any[] = [];
  newArrivals: any[] = [];
  bestSellers: any[] = [];
  categories: string[] = [];

  displayedCategories: string[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private router: Router,
    public authService: AuthService,
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
              console.error('Erreur backend lors de la récupération des produits :', err);
              return of([]);
            }),
          );
        }),
      )
      .subscribe((p) => {
        this.products = p || [];

        this.categories = Array.from(
          new Set(this.products.map((item: any) => item.category).filter(Boolean)),
        ).sort((a, b) => a.localeCompare(b));

        this.displayedCategories = this.categories.slice(0, 5);

        this.newArrivals = [...this.products].reverse().slice(0, 8);

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

  goToAllProducts() {
    this.router.navigate(['/all-products']);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  addToCart(event: Event, product: any): void {
    event.stopPropagation();

    if (product.quantity < 5) return;

    if (!this.authService.isLoggedIn()) {
      this.authService.openLoginModal();
      return;
    }

    try {
      this.cartService.addToCart(product, 1);
    } catch (error: any) {
      alert(error.message);
    }
  }
}
