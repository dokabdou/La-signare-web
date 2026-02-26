import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, ClickOutsideDirective],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  cartCount = 0;
  categories$: Observable<string[]>;
  conveyorProducts$: Observable<any[]>; // <-- New Observable
  dropdownOpen = false;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private router: Router,
  ) {
    // Existing categories logic
    this.categories$ = this.productService
      .getProducts()
      .pipe(
        map((products) =>
          Array.from(new Set(products.map((p: any) => p.category).filter(Boolean))).sort((a, b) =>
            a.localeCompare(b),
          ),
        ),
      );

    // New Conveyor logic: Shuffle randomly and pick up to 10
    this.conveyorProducts$ = this.productService.getProducts().pipe(
      map((products) => {
        if (!products) return [];
        // Shuffle the array randomly
        const shuffled = [...products].sort(() => 0.5 - Math.random());
        // Return up to 10 items (if fewer than 10 exist, it just returns all of them)
        return shuffled.slice(0, 10);
      }),
    );
  }

  ngOnInit() {
    this.cartService.cart$.subscribe(
      (c) => (this.cartCount = c.reduce((s, i) => s + i.quantity, 0)),
    );
  }

  goToCategory(cat: string) {
    this.dropdownOpen = false;
    this.router.navigate(['/category', cat]);
  }

  goHome() {
    this.router.navigate(['/']);
  }

  search(term: string) {
    if (term?.trim()) this.router.navigate(['/'], { queryParams: { search: term } });
  }

  goToProduct(id: string) {
    this.router.navigate(['/product', id]);
  }

  goAdmin() {
    this.router.navigate(['/admin']);
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  closeDropdown() {
    this.dropdownOpen = false;
  }
}
