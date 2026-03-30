import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-new-arrivals',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './new-arrivals.component.html',
  styleUrls: ['./new-arrivals.component.css', '../../../styles.css'],
})
export class NewArrivalsComponent implements OnInit, OnDestroy {
  newArrivals: any[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.productService
      .getProducts()
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          console.error('Le chargement des produits a échoué.', err);
          return of([]);
        }),
      )
      .subscribe((products) => {
        this.newArrivals = [...(products || [])].reverse();
        this.cdr.detectChanges();
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
