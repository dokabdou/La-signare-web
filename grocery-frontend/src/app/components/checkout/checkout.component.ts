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
  styleUrls: ['./checkout.component.css', '../../../styles.css'],
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

    if (typeof window !== 'undefined') {
      this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    }
  }

  switchTab(tab: 'cart' | 'past-orders') {
    this.activeTab = tab;
  }

  calculateTotal() {
    this.total = this.cart.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);
  }

  updateQty(product: any, targetQty: number): void {
    if (targetQty > 0) {
      this.cartService.updateQuantity(product, targetQty);
    } else {
      this.removeFromCart(product.id);
    }
  }

  removeFromCart(productId: string): void {
    this.cartService.removeFromCart(productId);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }

  generateReceiptHtml(order: any): string {
    const itemsHtml = order.items
      .map(
        (item: any) => `
      <tr>
        <td>${item.name}</td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">${(item.price * item.quantity).toFixed(2)} €</td>
      </tr>
    `,
      )
      .join('');

    return `
      <html>
        <head>
          <style>
            body { font-family: 'Courier New', Courier, monospace; color: #000; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff; }
            .receipt-header, .receipt-footer { text-align: center; margin-bottom: 1rem; }
            .receipt-header h2 { margin: 0; font-size: 1.2rem; }
            .receipt-items { width: 100%; border-top: 1px dashed #000; border-bottom: 1px dashed #000; margin-bottom: 1rem; border-collapse: collapse; }
            .receipt-items th, .receipt-items td { padding: 8px 0; border: none; font-size: 0.85rem; }
            .receipt-total { margin-top: 15px; text-align: right; font-size: 0.95rem; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="receipt-header">
            <h2>Ticket de Caisse</h2>
            <h2>🛒 La signare - Épicerie du Monde</h2>
            <p>LA SIGNARE - Épicerie Du Monde, 11 Rue de Bernières, 14000 Caen</p>
            <p> +33 6 36 02 23 91 </p>
            <p>Nous vous remercions pour votre commande, <br>
				<b>${order.customerName}</b> (${order.phone})
			!</p>
          </div>
          <table class="receipt-items">
            <thead>
              <tr>
                <th style="text-align: left;">Article</th>
                <th style="text-align: center;">Qté</th>
                <th style="text-align: right;">Prix</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="receipt-total">
            Total : ${order.total.toFixed(2)} €
          </div>
          <div class="receipt-footer">
            <p>Date : ${new Date(order.createdAt).toLocaleString('fr-FR')}</p>
          </div>
        </body>
      </html>
    `;
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
      this.orderError = true;
      this.errorMessage =
        'Veuillez vous connecter et vérifier que votre profil contient un numéro de téléphone pour passer commande.';
      return;
    }

    this.loading = true;

    const itemsToSave = this.cart.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.cartQuantity,
      category: item.category,
      imageUrl: item.imageUrl || item.product?.imageUrl || 'assets/placeholder.jpg',
    }));

    const finalizedOrder = {
      customerName: this.currentUser.name,
      phone: this.currentUser.phone,
      email: this.currentUser.email,
      items: itemsToSave, // Use the flattened items here
      total: this.total,
      status: 'Pending',
    };

    this.orderService.createOrder(finalizedOrder).subscribe({
      next: (res) => {
        this.loading = false;
        this.orderSuccess = true;

        // 1. Generate the HTML Receipt
        const receiptHtml = this.generateReceiptHtml(finalizedOrder);

        // 2. Send the email via your OrderService (or a dedicated EmailService)
        // Ensure you have an endpoint in your backend to accept this and send via SMTP/SendGrid/etc.
        const emailPayload = {
          to: finalizedOrder.email,
          subject: `Reçu de votre commande`,
          htmlBody: receiptHtml,
        };

        // Note: You will need to add a 'sendEmail' method to your OrderService handling the HTTP POST.
        if (this.orderService.sendEmail) {
          this.orderService.sendEmail(emailPayload).subscribe({
            error: (err) => console.error("Échec de l'envoi du reçu par email", err),
          });
        }

        this.cartService.clearCart();

        setTimeout(() => {
          this.orderSuccess = false;
          this.switchTab('past-orders');
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        this.orderError = true;
        this.errorMessage = err.error?.error || 'Erreur lors de la commande. Veuillez réessayer.';
      },
    });
  }
}
