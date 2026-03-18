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

  addToCart(product: any, quantity = 1) {
    const cart = this.load();
    const existing = cart.find((i: any) => i.id === product.id);
    if (existing) existing.quantity += quantity;
    else cart.push({ ...product, quantity });
    this.save(cart);

    this.itemAddedSource.next(product.name);
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
    if (this.isBrowser) localStorage.removeItem(this.getCartKey());
    this.cartSubject.next([]);
  }
}
