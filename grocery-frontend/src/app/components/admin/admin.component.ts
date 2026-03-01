import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReplaySubject, Subscription } from 'rxjs';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit, OnDestroy {
  activeTab: 'stocks' | 'orders' | 'receipts' = 'stocks';

  name = '';
  description = '';
  price = 0;
  category = '';
  imageUrl = '';
  products$ = new ReplaySubject<any[]>(1);
  loading = false;
  error = '';
  editingId: string | null = null;
  selectedCategory: string = '';
  categories: string[] = [];

  orders: any[] = [];
  receipts: any[] = [];
  ordersLoading = false;
  selectedReceiptToPrint: any = null;
  orderSearchTerm = '';
  private ordersSubscription!: Subscription;

  constructor(
    private ps: ProductService,
    private os: OrderService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadOrders();
  }

  ngOnDestroy(): void {
    if (this.ordersSubscription) {
      this.ordersSubscription.unsubscribe();
    }
  }

  switchTab(tab: 'stocks' | 'orders' | 'receipts') {
    this.activeTab = tab;
  }

  loadOrders(): void {
    this.ordersLoading = true;
    this.ordersSubscription = this.os.getOrders().subscribe({
      next: (ordersData) => {
        this.orders = ordersData.sort((a, b) => {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });

        this.receipts = this.orders.filter((o) => o.status === 'Delivered');

        this.ordersLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.ordersLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  getFilteredOrders(): any[] {
    if (!this.orderSearchTerm) return this.orders;
    const term = this.orderSearchTerm.toLowerCase();
    return this.orders.filter(
      (o) =>
        (o.customerName && o.customerName.toLowerCase().includes(term)) ||
        (o.email && o.email.toLowerCase().includes(term)) ||
        (o.phone && o.phone.toLowerCase().includes(term)) ||
        (o.createdAt && o.createdAt.toLowerCase().includes(term)),
    );
  }

  updateOrderStatus(orderId: string, newStatus: string): void {
    const orderIndex = this.orders.findIndex((o) => o.id === orderId);
    if (orderIndex > -1) {
      const updatedOrder = { ...this.orders[orderIndex], status: newStatus };

      this.os.updateOrder(orderId, updatedOrder).subscribe({
        error: () => {
          this.loadOrders();
        },
      });
    }
  }

  deleteOrder(orderId: string): void {
    if (confirm('Are you sure you want to delete this order?')) {
      this.os.deleteOrder(orderId).subscribe();
    }
  }

  printReceipt(receipt: any) {
    this.selectedReceiptToPrint = receipt;
    this.cdr.detectChanges();

    setTimeout(() => {
      window.print();
    }, 200);
  }

  getReceiptItems(receipt: any): any[] {
    if (!receipt || !receipt.items) return [];
    if (typeof receipt.items === 'string') {
      try {
        return JSON.parse(receipt.items);
      } catch (e) {
        return [];
      }
    }
    return receipt.items;
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imageUrl = reader.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  loadProducts(): void {
    this.loading = true;
    this.ps.getProducts().subscribe({
      next: (p) => {
        const products = p || [];
        this.products$.next(products);
        this.extractCategories(products);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Failed to load products.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  extractCategories(products: any[]): void {
    const cats = Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b),
    );
    this.categories = cats as string[];
  }

  getDisplayedProducts(products: any[]): any[] {
    if (!this.selectedCategory) return products;
    return products.filter((p) => p.category === this.selectedCategory);
  }

  filterByCategory(cat: string): void {
    this.selectedCategory = this.selectedCategory === cat ? '' : cat;
  }

  startEdit(product: any): void {
    this.editingId = product.id;
    this.name = product.name;
    this.description = product.description;
    this.price = product.price;
    this.category = product.category;
    this.imageUrl = product.imageUrl;
  }

  cancelEdit(): void {
    this.editingId = null;
    this.name = '';
    this.description = '';
    this.price = 0;
    this.category = '';
    this.imageUrl = '';
  }

  save(): void {
    const payload = {
      name: this.name,
      description: this.description,
      price: this.price,
      category: this.category,
      imageUrl: this.imageUrl,
    };

    if (this.editingId) {
      this.ps.updateProduct(this.editingId, payload).subscribe({
        next: () => {
          this.cancelEdit();
          this.loadProducts();
        },
      });
    } else {
      this.ps.createProduct(payload).subscribe({
        next: () => {
          this.cancelEdit();
          this.loadProducts();
        },
      });
    }
  }

  goToProduct(id: string) {
    this.router.navigate(['/product', id]);
  }

  deleteProduct(id: string): void {
    if (!confirm('Delete this product?')) return;
    this.ps.deleteProduct(id).subscribe({
      next: () => this.loadProducts(),
    });
  }
}
