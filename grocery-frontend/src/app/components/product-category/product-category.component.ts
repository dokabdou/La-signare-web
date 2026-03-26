import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { switchMap, takeUntil, catchError } from 'rxjs/operators';
import { Subject, of } from 'rxjs';

@Component({
  selector: 'app-product-category',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-category.component.html',
  styleUrls: ['./product-category.component.css', '../../../styles.css'],
})
export class ProductCategoryComponent implements OnInit, OnDestroy {
  category = '';
  products: any[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          this.category = params.get('category') || '';
          this.products = [];
          this.cdr.detectChanges();

          return this.productService.getProducts(this.category).pipe(
            catchError((err) => {
              console.error('Erreur backend lors de la récupération de la catégorie :', err);
              return of([]);
            }),
          );
        }),
      )
      .subscribe((p) => {
        this.products = p;
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goToProduct(id: string) {
    this.router.navigate(['/product', id]);
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
