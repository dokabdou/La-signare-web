import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class CartService {
  private isBrowser = typeof window !== 'undefined';
  private cartSubject = new BehaviorSubject<any[]>([]);
  cart$ = this.cartSubject.asObservable();

  private itemAddedSource = new Subject<string>();
  itemAdded$ = this.itemAddedSource.asObservable();

  private currentUser: any = null;

  constructor(private authService: AuthService) {
    if (this.isBrowser) {
      this.authService.currentUser$.subscribe((user) => {
        this.currentUser = user;
        this.cartSubject.next(this.load());
      });
    }
  }

  private getCartKey(): string {
    return this.currentUser?.email ? `cart_${this.currentUser.email}` : 'cart_guest';
  }

  private load(): any[] {
    if (!this.isBrowser) return [];
    try {
      return JSON.parse(localStorage.getItem(this.getCartKey()) || '[]');
    } catch {
      return [];
    }
  }

  private save(cart: any[]) {
    if (this.isBrowser) {
      localStorage.setItem(this.getCartKey(), JSON.stringify(cart));
    }
    this.cartSubject.next([...cart]);
  }

  getCartValue(): any[] {
    return this.cartSubject.value;
  }

  addToCart(product: any, quantity = 1) {
    const cart = this.load();
    const existing = cart.find((i: any) => i.id === product.id);
    const currentQtyInCart = existing ? existing.quantity : 0;

    // CRITICAL CHECK: Backend Stock vs (Cart Qty + New Qty)
    // We check if adding this amount is near the physical stock, not below it
    if (product.quantity - (currentQtyInCart + quantity) <= 5) {
      throw new Error(`Stock insuffisant`);
    }

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        ...product,
        quantity,
        imageUrl: product.imageUrl || product.product?.imageUrl || 'assets/placeholder.jpg',
      });
    }

    this.save(cart);
    this.itemAddedSource.next(product.name);
  }

  updateQuantity(product: any, quantity: number) {
    const cart = this.load();
    const idx = cart.findIndex((i: any) => i.id === product.id);

    if (idx > -1) {
      if (quantity <= 0) {
        cart.splice(idx, 1);
      } else {
        // Check stock before updating
        if (product.quantity - quantity < 0) {
          alert(`Action impossible : Seulement ${product.quantity} en stock.`);
          return;
        }
        cart[idx].quantity = quantity;
      }
      this.save(cart);
    }
  }

  removeFromCart(productId: string) {
    const cart = this.load().filter((i: any) => i.id !== productId);
    this.save(cart);
  }

  clearCart() {
    if (this.isBrowser) localStorage.removeItem(this.getCartKey());
    this.cartSubject.next([]);
  }
}
