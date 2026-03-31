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

  getCartQty(productId: string): number {
    const currentCart = this.getCartValue();
    const existingItem = currentCart.find((i: any) => i.id === productId);
/*     console.log('getCartQty :: ', currentCart);
    console.log('existingItem :: ', existingItem);
 */    return existingItem ? existingItem.cartQuantity : 0;
  }

  checkQuantity(product: any, quantity: number): boolean {
    if (!product) return false;

    const inCart = this.getCartQty(product.id);
    const proposedTotal = inCart + quantity;

    /* console.log('inCart :: ', inCart);
    console.log('proposedTotal :: ', proposedTotal);
    console.log('product QTY : ', product.quantity) */;

    // Check: Database Stock - (In Cart + Selected)
    if (product.quantity - proposedTotal < 5) {
      alert(`Stock insuffisant. Vous avez déjà ${inCart} unité(s) dans votre panier.`);
      return false;
    }
    return true;
  }

  addToCart(product: any, quantity = 1) {
    const cart = this.load();
    const existing = cart.find((i: any) => i.id === product.id);

    if (!this.checkQuantity(product, quantity)) {
      return;
    }

    if (existing) {
      existing.cartQuantity += quantity;
    } else {
      cart.push({
        ...product,
        cartQuantity: quantity,
      });
    }

    /* console.log('addToCART :: ', cart);
    console.log('exisTING == ', existing); */

    this.save(cart);
    this.itemAddedSource.next(product.name);
  }

  updateQuantity(product: any, targetQuantity: number) {
    const cart = this.load();
    const idx = cart.findIndex((i: any) => i.id === product.id);

    if (idx > -1) {
      const existing = cart[idx];
      const currentQty = existing.cartQuantity;

      const delta = targetQuantity - currentQty;

      if (targetQuantity <= 0) {
        cart.splice(idx, 1);
      } else {
        //console.log('updateQty target : ', targetQuantity);
        if (delta > 0) {
          // We are INCREASING the quantity.
          // Pass the delta (amount to add) into checkQuantity.
          if (this.checkQuantity(product, delta)) {
            existing.cartQuantity = targetQuantity;
          }
        } else if (delta < 0) {
          // We are DECREASING the quantity.
          // No stock check needed, just apply the reduction.
          existing.cartQuantity = targetQuantity;
        }
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
