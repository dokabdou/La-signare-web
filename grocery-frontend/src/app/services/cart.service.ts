import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OrderService } from './order.service';
import { AuthService } from './auth.service';
import { createDeflate } from 'zlib';

@Injectable({ providedIn: 'root' })
export class CartService {
  // creates an order and save it to the orders service
  // when a product is added to the cart, we can create an order with status "UnProcessed" and save it to the orders service
  // updates the order item in the orders service when the quantity is updated or the item is removed from the cart

  private isBrowser = typeof window !== 'undefined';
  private cartSubject = new BehaviorSubject<any[]>(this.load());
  cart$ = this.cartSubject.asObservable();

  private draftOrderKey = 'activeDraftOrderId'; // kind of like a bridge between cart and orders to keep track of the backend draft order ID
  private orderId = '';

  private currentUser: any = null;

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
  ) {
    if (this.isBrowser) {
      this.orderId = localStorage.getItem(this.draftOrderKey) || '';
      console.log('CartService initialized with draft order ID:', this.orderId);

      this.authService.currentUser$.subscribe((user) => {
        this.currentUser = user;
      });
    }
  }

  private load(): any[] {
    if (!this.isBrowser) return [];
    try {
      return JSON.parse(localStorage.getItem('cart') || '[]');
    } catch {
      return [];
    }
  }

  private save(cart: any[]) {
    if (this.isBrowser) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
    this.cartSubject.next([...cart]);

    this.syncWithBackend(cart);
  }

  addToCart(product: any, quantity = 1) {
    const cart = this.load();
    const existing = cart.find((i: any) => i.id === product.id);
    if (existing) existing.quantity += quantity;
    else cart.push({ ...product, quantity });
    this.save(cart);
  }

  updateQuantity(productId: string, quantity: number) {
    const cart = this.load();
    const idx = cart.findIndex((i: any) => i.id === productId);
    if (idx > -1) {
      if (quantity <= 0) cart.splice(idx, 1);
      else cart[idx].quantity = quantity;
      this.save(cart);
    }
  }

  removeFromCart(productId: string) {
    const cart = this.load().filter((i: any) => i.id !== productId);
    this.save(cart);
  }

  clearCart() {
    if (this.isBrowser) localStorage.removeItem('cart');
    this.cartSubject.next([]);

    // Clean up the backend draft so it doesn't leave ghost orders
    if (this.orderId) {
      this.orderService.deleteOrder(this.orderId).subscribe();
      this.clearOrderId();
    }
  }

  finalizeCheckout() {
    if (this.isBrowser) localStorage.removeItem('cart');
    this.cartSubject.next([]);
    this.clearOrderId();
  }

  getDraftOrderId(): string {
    return this.orderId;
  }

  private clearOrderId() {
    this.orderId = '';
    if (this.isBrowser) localStorage.removeItem(this.draftOrderKey);
  }

  private syncWithBackend(cart: any[]) {
    if (!this.isBrowser) return;

    if (!this.currentUser || !this.currentUser.email) return;

    console.log('Syncing cart with backend. Current cart:', cart);
    console.log('id : ', this.orderId);

    // If cart is completely emptied, delete the backend draft order
    if (cart.length === 0 && this.orderId) {
      this.orderService.deleteOrder(this.orderId).subscribe();
      this.clearOrderId();
      return;
    }

    if (cart.length > 0) {
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const orderPayload = {
        customerName: this.currentUser.name || 'Unknown User',
        phone: this.currentUser.phone || '',
        email: this.currentUser.email,
        items: cart,
        total: total,
        status: 'UnProcessed',
      };

      if (this.orderId) {
        // ID exists: Update the existing draft
        this.orderService
          .updateOrder(this.orderId, orderPayload)
          .pipe(catchError(() => of(null)))
          .subscribe();
      } else {
        // No ID exists: Create new order and save the generated ID
        this.orderService
          .createOrder(orderPayload)
          .pipe(catchError(() => of(null)))
          .subscribe((createdOrder) => {
            if (createdOrder && createdOrder.id) {
              this.orderId = createdOrder.id;
              localStorage.setItem(this.draftOrderKey, this.orderId);
            }
          });
      }
    }
  }
}
