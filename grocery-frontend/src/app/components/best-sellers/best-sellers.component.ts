import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-best-sellers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './best-sellers.component.html',
  styleUrls: ['./best-sellers.component.css', "../../../styles.css"],
})
export class BestSellersComponent implements OnInit, OnDestroy {
  bestSellers: any[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.productService
      .getProducts()
      .pipe(
        takeUntil(this.destroy$),
        catchError((err) => {
          console.error('Failed to load products:', err);
          return of([]);
        }),
      )
      .subscribe((products) => {
        // 1 item per category
        const topProducts = [];
        const seenCategories = new Set();
        for (const item of products || []) {
          if (item.category && !seenCategories.has(item.category)) {
            seenCategories.add(item.category);
            topProducts.push(item);
          }
        }
        this.bestSellers = topProducts;
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

  addToCart(event: Event, product: any): void {
    event.stopPropagation();
    this.cartService.addToCart(product, 1);
  }
}
