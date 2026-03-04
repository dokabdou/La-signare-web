import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
})
export class CheckoutComponent implements OnInit {
  cart: any[] = [];
  total = 0;
  customerName = '';
  phone = '';
  loading = false;
  message = '';
  currentUser: any = null;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.cartService.cart$.subscribe((cart) => {
      this.cart = cart;
      this.total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    });
	this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  }

  updateQty(productId: string, qty: number): void {
    this.cartService.updateQuantity(productId, qty);
  }

  removeFromCart(productId: string): void {
    this.cartService.removeFromCart(productId);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }

  placeOrder(): void {
    this.loading = true;
    const order = {
      customerName: this.currentUser.name,
      phone: this.currentUser.phone,
	  email: this.currentUser.email,
      items: this.cart,
      total: this.total,
    };

	console.log('Placing order:', order);

    this.orderService.createOrder(order).subscribe({
      next: (res) => {
        this.message = 'Order placed successfully!';
        this.cartService.clearCart();
        this.loading = false;
        setTimeout(() => this.router.navigate(['/']), 2000);
      },
      error: (err) => {
        this.message = 'Error placing order. Please try again.';
        this.loading = false;
      },
    });
  }
}
