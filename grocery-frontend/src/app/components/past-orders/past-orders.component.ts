import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-past-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './past-orders.component.html',
  styleUrls: ['./past-orders.component.css', '../../../styles.css'],
})
export class PastOrdersComponent implements OnInit {
  pastOrders: any[] = [];
  ordersLoading = false;
  currentUser: any = null;
  selectedOrder: any = null;

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private cartService: CartService,
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

      if (this.currentUser && this.currentUser.email) {
        this.loadPastOrders();
      }
    }
  }

  loadPastOrders() {
    if (!this.currentUser || !this.currentUser.email) return;
    this.ordersLoading = true;

    this.orderService.getOrders().subscribe({
      next: (orders) => {
        this.pastOrders = orders
          .filter((o) => o.email === this.currentUser.email)
          .sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
          );
        this.ordersLoading = false;
      },
      error: (err) => {
        console.error('Échec du chargement des commandes', err);
        this.ordersLoading = false;
      },
    });
  }

  viewOrderDetails(order: any) {
    this.selectedOrder = order;
  }

  backToList() {
    this.selectedOrder = null;
  }

  cancelOrder(order: any, event?: Event) {
    if (event) event.stopPropagation();

    if (confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      const updatedOrder = { ...order, status: 'Cancelled' };
      this.orderService.updateOrder(order.id, updatedOrder).subscribe({
        next: () => {
          this.loadPastOrders();
        },
        error: (err) => {
          alert("L'annulation de la commande a échoué. Veuillez réessayer.");
        },
      });
    }
  }

  reorder(order: any, event?: Event) {
    if (event) event.stopPropagation();

    const items = this.getOrderItems(order);

    if (items.length > 0) {
      items.forEach((item) => {
        this.cartService.addToCart(item, item.quantity);
      });

      alert('🛒 Les articles de cette commande ont été ajoutés à votre panier !');
    }
  }

  reorderItem(item: any) {
    this.cartService.addToCart(item, item.quantity);
    alert(`🛒 ${item.quantity}x ${item.name} ajouté(s) à votre panier !`);
  }

  getOrderItems(order: any): any[] {
    if (!order || !order.items) return [];

    let items = [];
    if (typeof order.items === 'string') {
      try {
        items = JSON.parse(order.items);
      } catch (e) {
        return [];
      }
    } else {
      items = order.items;
    }

    return items.map((item: any) => ({
      ...item,
      imageUrl: item.imageUrl || item.product?.imageUrl || 'assets/placeholder.jpg',
    }));
  }
}
