import { NavbarComponent } from './components/navbar/navbar.component';
import { Component, HostListener, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { CartService } from './services/cart.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['../styles.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  protected readonly title = signal('grocery-frontend');
  showScrollBtn = false;

  toastMessage: string | null = null;
  private cartSub!: Subscription;
  private timeoutRef: any;

  constructor(private cartService: CartService) {}

  ngOnInit() {
    this.cartSub = this.cartService.itemAdded$.subscribe((productName) => {
      this.showToast(`🛒 ${productName} added to cart!`);
    });
  }

  ngOnDestroy() {
    if (this.cartSub) this.cartSub.unsubscribe();
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    if (this.timeoutRef) clearTimeout(this.timeoutRef);

    this.timeoutRef = setTimeout(() => {
      this.toastMessage = null;
    }, 3000);
  }

  closeToast() {
    this.toastMessage = null;
    if (this.timeoutRef) clearTimeout(this.timeoutRef);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showScrollBtn = window.scrollY > 300;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
