import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-all-products',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './all-products.component.html',
  styleUrls: ['./all-products.component.css'],
})
export class AllProductsComponent implements OnInit, OnDestroy {
  products: any[] = [];
  categories: string[] = [];
  selectedCategory: string = '';
  searchTerm: string = '';
  loading = true;

  private routeSub!: Subscription;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    public authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
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

    this.routeSub = this.route.queryParamMap.subscribe((params) => {
      this.searchTerm = (params.get('search') || '').toLowerCase();
      if (this.searchTerm) {
        this.selectedCategory = '';
      }
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) this.routeSub.unsubscribe();
  }

  getDisplayedProducts(): any[] {
    let filtered = this.products;

    if (this.selectedCategory) {
      filtered = filtered.filter((p) => p.category === this.selectedCategory);
    }

    if (this.searchTerm) {
      filtered = filtered.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(this.searchTerm)) ||
          (p.description && p.description.toLowerCase().includes(this.searchTerm)),
      );
    }

    return filtered;
  }

  filterByCategory(cat: string): void {
    this.selectedCategory = this.selectedCategory === cat ? '' : cat;

    if (this.selectedCategory && this.searchTerm) {
      this.router.navigate(['/all-products']);
    }
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
