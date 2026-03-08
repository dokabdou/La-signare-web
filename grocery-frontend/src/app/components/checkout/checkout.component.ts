import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

import { PastOrdersComponent } from '../past-orders/past-orders.component';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, PastOrdersComponent], 
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
})
export class CheckoutComponent implements OnInit {
  activeTab: 'cart' | 'past-orders' = 'cart';

  cart: any[] = [];
  total = 0;
  loading = false;
  message = '';
  currentUser: any = null;

  orderSuccess: boolean = false;
  orderError: boolean = false;
  errorMessage: string = '';
  emptyCartError: boolean = false;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
	this.cart = [];

    this.cartService.cart$.subscribe((cart) => {
      this.cart = cart || [];
      this.calculateTotal();
    });

    if (!this.authService.isLoggedIn()) {
      this.authService.openLoginModal();
    }

    this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  }

  switchTab(tab: 'cart' | 'past-orders') {
    this.activeTab = tab;
  }

  calculateTotal() {
    this.total = this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  updateQty(id: string, qty: number): void {
    if (qty > 0) {
      this.cartService.updateQuantity(id, qty);
    } else {
      this.removeFromCart(id);
    }
  }

  removeFromCart(productId: string): void {
    this.cartService.removeFromCart(productId);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }

  placeOrder(): void {
    this.orderError = false;
    this.orderSuccess = false;
    this.errorMessage = '';
    this.emptyCartError = false;

    if (this.cart.length === 0) {
      this.emptyCartError = true;
      setTimeout(() => {
        this.emptyCartError = false;
      }, 3000);
      return;
    }

    if (!this.currentUser || !this.currentUser.name || !this.currentUser.phone) {
      this.message = 'Please log in to place an order.';
      return;
    }

    this.loading = true;
    const draftId = this.cartService.getDraftOrderId();

    const finalizedOrder = {
      customerName: this.currentUser.name,
      phone: this.currentUser.phone,
      email: this.currentUser.email,
      items: this.cart,
      total: this.total,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    if (draftId) {
      this.orderService.updateOrder(draftId, finalizedOrder).subscribe({
        next: (res) => {
          this.loading = false;
          this.orderSuccess = true;
          this.cartService.finalizeCheckout();

          setTimeout(() => {
            this.orderSuccess = false;
            this.switchTab('past-orders');
          }, 2000);
        },
        error: (err) => {
          this.loading = false;
          this.orderError = true;
          this.errorMessage = 'Error placing order. Please try again.';
          console.error('Order creation failed:', err);
        },
      });
    }
  }
}
