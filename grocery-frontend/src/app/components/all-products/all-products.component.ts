import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-all-products',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './all-products.component.html',
  styleUrls: ['./all-products.component.css'],
})
export class AllProductsComponent implements OnInit {
  products: any[] = [];
  categories: string[] = [];
  selectedCategory: string = '';
  loading = true;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    public authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.productService.getProducts().subscribe({
      next: (p) => {
        this.products = p || [];
        this.categories = Array.from(
          new Set(this.products.map((item) => item.category).filter(Boolean)),
        ).sort((a, b) => a.localeCompare(b));
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  getDisplayedProducts(): any[] {
    if (!this.selectedCategory) return this.products;
    return this.products.filter((p) => p.category === this.selectedCategory);
  }

  filterByCategory(cat: string): void {
    // Toggle off if clicking the same category
    this.selectedCategory = this.selectedCategory === cat ? '' : cat;
  }

  goToProduct(id: string) {
    this.router.navigate(['/product', id]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  addToCart(event: Event, product: any): void {
    event.stopPropagation();
    if (!this.authService.isLoggedIn()) {
      this.authService.openLoginModal();
      return;
    }
    this.cartService.addToCart(product, 1);
  }
}
