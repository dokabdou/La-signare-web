import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css', '../../../styles.css'],
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
  authConfirmPassword = '';
  authName = '';
  authPhone = '';
  authError = '';
  authLoading = false;

  categoriesList: string[] = [];

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    public authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
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
    this.categories$.subscribe((cats) => (this.categoriesList = cats));
  }

  ngOnInit() {
    this.cartService.cart$.subscribe(
      (c) => (this.cartCount = c.reduce((s, i) => s + i.cartQuantity, 0)),
    );

    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
      this.isAdmin = this.authService.isAdmin();
      this.cdr.detectChanges();
    });

    this.authService.showLoginModal$.subscribe((show) => {
      this.showLoginModal = show;
      if (show) {
        this.resetAuthForm();
      }
      this.cdr.detectChanges();
    });
  }

  resetAuthForm() {
    this.authEmail = '';
    this.authPassword = '';
    this.authConfirmPassword = '';
    this.authName = '';
    this.authPhone = '';
    this.authError = '';
    this.isRegisterMode = false;
  }

  closeModal() {
    this.showLoginModal = false;
    this.authService.closeLoginModal();
  }

  toggleAuthMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.authError = '';
    this.authPassword = '';
    this.authConfirmPassword = '';
  }
  // !! : ensures that empty strings are strict false booleans
  get isFormValid(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailRegex.test(this.authEmail);

    const isPasswordValid = !!this.authPassword && this.authPassword.length >= 8;

    if (!this.isRegisterMode) {
      return !!(isEmailValid && isPasswordValid);
    }

    const phoneRegex = /^[0-9+\-\s()]{8,20}$/;
    const isPhoneValid = phoneRegex.test(this.authPhone);

    const isNameValid = !!this.authName && this.authName.trim().length > 0;
    const passwordsMatch = this.authPassword === this.authConfirmPassword;

    return !!(isEmailValid && isPasswordValid && isPhoneValid && isNameValid && passwordsMatch);
  }

  submitAuth() {
    this.authError = '';
    this.authLoading = true;

    if (this.isRegisterMode) {
      const newUser = {
        name: this.authName.trim(),
        email: this.authEmail.trim(),
        password: this.authPassword,
        phone: this.authPhone.trim(),
      };

      this.authService.register(newUser).subscribe({
        next: () => {
          this.authLoading = false;
          this.closeModal(); // force reload
          window.location.reload();
        },
        error: (err) => {
          const serverErrorMessage = err.error?.error || err.error?.message;
          this.authError = serverErrorMessage || "L'inscription a échoué. Veuillez réessayer.";
          this.authLoading = false;
          this.cdr.detectChanges();
        },
      });
    } else {
      this.authService.login(this.authEmail.trim(), this.authPassword).subscribe({
        next: () => {
          this.authLoading = false;
          this.closeModal();
          window.location.reload();
        },
        error: (err) => {
          this.authError =
            err.error?.error || "Email ou mot de passe incorrect, ou l'utilisateur n'existe pas.";
          this.authLoading = false;
          this.cdr.detectChanges();
        },
      });
    }
  }

  logout() {
    this.authService.logout();
    setTimeout(() => {
      if (window.location.pathname === '/') {
        window.location.reload();
      } else {
        window.location.href = '/';
      }
    }, 200);
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

  goToLocation() {
    this.dropdownOpen = false;
    this.router.navigate(['/location']);
  }

  search(term: string) {
    if (term?.trim()) {
      const normalizedTerm = term.trim().toLowerCase();
      const matchedCategory = this.categoriesList.find((c) => c.toLowerCase() === normalizedTerm);

      if (matchedCategory) {
        this.router.navigate(['/category', matchedCategory]);
      } else {
        this.router.navigate(['/all-products'], { queryParams: { search: term.trim() } });
      }
    } else {
      this.router.navigate(['/all-products']);
    }
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
