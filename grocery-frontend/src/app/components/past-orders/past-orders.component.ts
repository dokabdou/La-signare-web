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
    let addedCount = 0;

    if (items.length > 0) {
      items.forEach((item) => {
        try {
          // Pass the item, but ensure quantity is treated as a number
          this.cartService.addToCart(item, Number(item.quantity));
          addedCount++;
        } catch (error: any) {
          console.error("Erreur lors de l'ajout :", error.message);
        }
      });

      if (addedCount > 0) {
        alert('🛒 Les articles de cette commande ont été ajoutés à votre panier !');
      } else {
        alert("⚠️ Impossible d'ajouter ces articles au panier.");
      }
    }
  }

  reorderItem(item: any) {
    try {
      this.cartService.addToCart(item, Number(item.quantity));
      alert(`🛒 ${item.quantity}x ${item.name} ajouté(s) à votre panier !`);
    } catch (error: any) {
      alert(`⚠️ Erreur : ${error.message}`);
    }
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

    return items.map((item: any) => {
      // 1. Hunt down the image no matter what the database named it
      const foundImage =
        item.imageUrl ||
        item.image ||
        item.product?.imageUrl ||
        item.product?.image ||
        // 2. Try the local asset with a leading slash to fix routing bugs
        '/assets/placeholder.jpg';

      return {
        ...item,
        // 3. If it is STILL the local placeholder but you don't have that file,
        // it will just show a broken icon. Let's ensure it always has a valid image:
        imageUrl: foundImage,
      };
    });
  }
}
