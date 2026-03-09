import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ClickOutsideDirective],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  cartCount = 0;
  categories$: Observable<string[]>;
  dropdownOpen = false;
  accountDropdownOpen = false;

  currentUser: any = null;
  isLoggedIn = false;
  isAdmin = false;
  showLoginModal = false;
  isRegisterMode = false;

  authEmail = '';
  authPassword = '';
  authName = '';
  authPhone = '';
  authError = '';
  authLoading = false;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    public authService: AuthService,
    private router: Router,
  ) {
    this.categories$ = this.productService
      .getProducts()
      .pipe(
        map((products) =>
          Array.from(new Set(products.map((p: any) => p.category).filter(Boolean))).sort((a, b) =>
            a.localeCompare(b),
          ),
        ),
      );
  }

  ngOnInit() {
    this.cartService.cart$.subscribe(
      (c) => (this.cartCount = c.reduce((s, i) => s + i.quantity, 0)),
    );

    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
      this.isAdmin = this.authService.isAdmin();
    });

    this.authService.showLoginModal$.subscribe((show) => {
      this.showLoginModal = show;
      if (show) {
        this.authEmail = '';
        this.authPassword = '';
        this.authName = '';
        this.authPhone = '';
        this.authError = '';
        this.isRegisterMode = false;
      }
    });
  }

  closeModal() {
    this.authService.closeLoginModal();
  }

  toggleAuthMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.authError = '';
  }

  submitAuth() {
    this.authError = '';
    if (!this.authEmail || !this.authPassword || (this.isRegisterMode && !this.authName)) {
      this.authError = 'Please fill in all required fields.';
      return;
    }

    this.authLoading = true;

    if (this.isRegisterMode) {
      const newUser = {
        name: this.authName,
        email: this.authEmail,
        phone: this.authPhone,
        password: this.authPassword,
      };
      this.authService.register(newUser).subscribe({
        next: () => {
          this.authLoading = false;
          this.closeModal();
        },
        error: () => {
          this.authError = 'Registration failed. Try again.';
          this.authLoading = false;
        },
      });
    } else {
      this.authService.login(this.authEmail, this.authPassword).subscribe({
        next: () => {
          this.authLoading = false;
          this.closeModal();
        },
        error: (err) => {
          this.authError = err.message;
          this.authLoading = false;
        },
      });
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  goToCategory(cat: string) {
    this.dropdownOpen = false;
    this.router.navigate(['/category', cat]);
  }

  goToAllProducts() {
    this.router.navigate(['/all-products']);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
