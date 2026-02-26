import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CartService {
  private isBrowser = typeof window !== 'undefined';
  private cartSubject = new BehaviorSubject<any[]>(this.load());
  cart$ = this.cartSubject.asObservable();

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
  }
}
