import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReplaySubject, Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit, OnDestroy {
  activeTab: 'stocks' | 'orders' | 'receipts' | 'users' | 'sync' = 'stocks';

  name = '';
  description = '';
  price = 0;
  quantity = 0;
  category = '';
  imageUrl = '';

  selectedProductIds: Set<string> = new Set();
  massEditPrice: number | null = null;
  massEditQuantity: number | null = null;
  massUpdating = false;

  products$ = new ReplaySubject<any[]>(1);
  currentProducts: any[] = [];

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
  receiptSearchTerm = '';

  users: any[] = [];
  usersLoading = false;
  userSearchTerm = '';

  editingUserId: string | null = null;
  editUserName = '';
  editUserEmail = '';
  editUserPhone = '';
  editUserPassword = '';

  syncingProducts = false;
  syncingOrders = false;
  syncingAll = false;
  syncMessage = '';

  private ordersSubscription!: Subscription;

  constructor(
    private ps: ProductService,
    private os: OrderService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadOrders();
    this.loadUsers();
  }

  ngOnDestroy(): void {
    if (this.ordersSubscription) {
      this.ordersSubscription.unsubscribe();
    }
  }

  switchTab(tab: 'stocks' | 'orders' | 'receipts' | 'users' | 'sync') {
    this.activeTab = tab;
  }

  toggleSelection(productId: string) {
    if (this.selectedProductIds.has(productId)) {
      this.selectedProductIds.delete(productId);
    } else {
      this.selectedProductIds.add(productId);
    }
  }

  toggleSelectAll() {
    const displayed = this.getDisplayedProducts(this.currentProducts);
    if (this.selectedProductIds.size === displayed.length) {
      this.selectedProductIds.clear();
    } else {
      displayed.forEach((p) => this.selectedProductIds.add(p.id));
    }
  }

  applyMassUpdate() {
    if (this.selectedProductIds.size === 0) return;
    if (this.massEditPrice === null && this.massEditQuantity === null) {
      alert('Please provide a new Price or Quantity to update.');
      return;
    }
    if (!confirm(`Are you sure you want to update ${this.selectedProductIds.size} products?`))
      return;

    this.massUpdating = true;
    const updateRequests: any[] = [];

    this.selectedProductIds.forEach((id) => {
      const product = this.currentProducts.find((p) => p.id === id);
      if (product) {
        const payload = {
          ...product,
          price: this.massEditPrice !== null ? this.massEditPrice : product.price,
          quantity: this.massEditQuantity !== null ? this.massEditQuantity : product.quantity,
        };
        updateRequests.push(this.ps.updateProduct(id, payload).pipe(catchError(() => of(null))));
      }
    });

    forkJoin(updateRequests).subscribe(() => {
      this.massUpdating = false;
      this.selectedProductIds.clear();
      this.massEditPrice = null;
      this.massEditQuantity = null;
      this.loadProducts();
    });
  }

  cancelMassEdit() {
    this.selectedProductIds.clear();
    this.massEditPrice = null;
    this.massEditQuantity = null;
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
        this.currentProducts = p || [];
        this.products$.next(this.currentProducts);
        this.extractCategories(this.currentProducts);
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
    this.selectedProductIds.clear();
  }

  startEdit(product: any): void {
    this.editingId = product.id;
    this.name = product.name;
    this.description = product.description;
    this.price = product.price;
    this.category = product.category;
    this.imageUrl = product.imageUrl;
    this.quantity = product.quantity;
  }

  cancelEdit(): void {
    this.editingId = null;
    this.name = '';
    this.description = '';
    this.price = 0;
    this.category = '';
    this.imageUrl = '';
    this.quantity = 0;
  }

  save(): void {
    const payload = {
      name: this.name,
      description: this.description,
      price: this.price,
      category: this.category,
      imageUrl: this.imageUrl,
      quantity: this.quantity,
    };
    if (this.editingId) {
      this.ps.updateProduct(this.editingId, payload).subscribe({
        next: () => {
          this.cancelEdit();
          this.loadProducts();
        },
      });
    } else {
      if (!payload.name || !payload.price || !payload.category) {
        this.error = 'Name, Price and Category are required.';
        alert(this.error);
        return;
      }
      this.ps.createProduct(payload).subscribe({
        next: () => {
          this.cancelEdit();
          this.loadProducts();
        },
      });
    }
  }

  goToProduct(product: any) {
    if (product.quantity < 10) return;
    this.router.navigate(['/product', product.id]);
  }

  deleteProduct(id: string): void {
    if (!confirm('Delete this product?')) return;
    this.ps.deleteProduct(id).subscribe({
      next: () => this.loadProducts(),
    });
  }

  loadOrders(): void {
    this.ordersLoading = true;
    this.ordersSubscription = this.os.getOrders().subscribe({
      next: (ordersData) => {
        this.orders = ordersData.sort((a, b) => {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
        this.receipts = this.orders.filter((o) => o.status === 'Ready');
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
    const activeOrders = this.orders.filter((o) => o.status !== 'Ready');
    if (!this.orderSearchTerm) return activeOrders;
    const term = this.orderSearchTerm.toLowerCase();
    return activeOrders.filter(
      (o) =>
        (o.customerName && String(o.customerName).toLowerCase().includes(term)) ||
        (o.email && String(o.email).toLowerCase().includes(term)) ||
        (o.phone && String(o.phone).toLowerCase().includes(term)) ||
        (o.createdAt && new Date(o.createdAt).toLocaleString().toLowerCase().includes(term)),
    );
  }

  getFilteredReceipts(): any[] {
    if (!this.receiptSearchTerm) return this.receipts;
    const term = this.receiptSearchTerm.toLowerCase();
    return this.receipts.filter(
      (o) =>
        (o.customerName && String(o.customerName).toLowerCase().includes(term)) ||
        (o.email && String(o.email).toLowerCase().includes(term)) ||
        (o.phone && String(o.phone).toLowerCase().includes(term)) ||
        (o.createdAt && new Date(o.createdAt).toLocaleString().toLowerCase().includes(term)),
    );
  }

  updateOrderStatus(orderId: string, newStatus: string): void {
    const orderIndex = this.orders.findIndex((o) => o.id === orderId);
    if (orderIndex > -1) {
      this.orders[orderIndex].status = newStatus;
      this.receipts = this.orders.filter((o) => o.status === 'Ready');
      this.cdr.detectChanges();
      const updatedOrder = { ...this.orders[orderIndex] };
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
      const printElement = document.querySelector('.receipt-print-container');
      if (printElement) {
        const printWindow = window.open(
          '',
          '_blank',
          'left=0,top=0,width=400,height=600,toolbar=0,scrollbars=0,status=0',
        );
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Receipt - ${receipt.id}</title>
                <style>
                  @page { size: 110mm 220mm; margin: 5mm; }
                  body { font-family: 'Courier New', Courier, monospace; color: #000; width: 100mm; margin: 0 auto; padding: 0; background: #fff; }
                  .receipt-header, .receipt-footer { text-align: center; margin-bottom: 1rem; }
                  .receipt-header h2 { margin: 0; font-size: 1.2rem; }
                  .receipt-items { width: 100%; border-top: 1px dashed #000; border-bottom: 1px dashed #000; margin-bottom: 1rem; border-collapse: collapse; }
                  .receipt-items th, .receipt-items td { padding: 5px 0; border: none; font-size: 0.85rem; }
                  .receipt-total { margin-top: 15px; text-align: right; font-size: 0.95rem; }
                </style>
              </head>
              <body>
                ${printElement.innerHTML}
                <script>
                  window.onload = function() {
                    setTimeout(function() {
                      window.print();
                      window.close();
                    }, 250);
                  };
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      }
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

  loadUsers() {
    this.usersLoading = true;
    this.auth.getAllCustomersAdmin().subscribe({
      next: (res) => {
        this.users = res;
        this.usersLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.usersLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  getFilteredUsers(): any[] {
    if (!this.userSearchTerm) return this.users;
    const term = this.userSearchTerm.toLowerCase();
    return this.users.filter(
      (u) =>
        (u.name && String(u.name).toLowerCase().includes(term)) ||
        (u.email && String(u.email).toLowerCase().includes(term)) ||
        (u.phone && String(u.phone).toLowerCase().includes(term)),
    );
  }

  toggleAdminRole(user: any) {
    const isPromoting = !user.admin;
    const action = isPromoting ? 'make this user an admin' : 'revoke admin rights for this user';

    if (!confirm(`Are you sure you want to ${action}?`)) {
      return;
    }

    const updatedUser = { ...user, admin: isPromoting };

    this.auth.updateUser(user.id, updatedUser).subscribe({
      next: () => {
        user.admin = isPromoting;
        this.cdr.detectChanges();
      },
      error: () => {
        alert('Failed to update user role.');
      },
    });
  }

  startEditUser(user: any) {
    this.editingUserId = user.id;
    this.editUserName = user.name || '';
    this.editUserEmail = user.email || '';
    this.editUserPhone = user.phone || '';
    this.editUserPassword = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEditUser() {
    this.editingUserId = null;
    this.editUserName = '';
    this.editUserEmail = '';
    this.editUserPhone = '';
    this.editUserPassword = '';
  }

  saveUser() {
    if (!this.editUserEmail) {
      alert('Email is required.');
      return;
    }

    const targetUser = this.users.find((u) => u.id === this.editingUserId);
    if (!targetUser) return;

    const updatedUser = {
      ...targetUser,
      name: this.editUserName.trim(),
      email: this.editUserEmail.trim(),
      phone: this.editUserPhone.trim(),
      password: this.editUserPassword ? this.editUserPassword : null,
    };

    this.auth.updateUser(this.editingUserId!, updatedUser).subscribe({
      next: () => {
        this.cancelEditUser();
        this.loadUsers();
      },
      error: (err) => {
        alert(err.error?.error || 'Failed to update user.');
      },
    });
  }

  deleteUser(userId: string) {
    if (!confirm('Are you SURE you want to completely delete this user? This cannot be undone.'))
      return;

    this.auth.deleteUser(userId).subscribe({
      next: () => this.loadUsers(),
      error: () => alert('Failed to delete user.'),
    });
  }

  syncProducts() {
    this.syncingProducts = true;
    this.syncMessage = 'Syncing Stocks to Google Sheets...';
    this.ps.syncToGoogleSheets().subscribe(() => {
      this.syncingProducts = false;
      this.syncMessage = 'Stocks successfully synced!';
      setTimeout(() => (this.syncMessage = ''), 4000);
      this.cdr.detectChanges();
    });
  }

  syncOrders() {
    this.syncingOrders = true;
    this.syncMessage = 'Syncing Orders to Google Sheets...';
    this.os.syncToGoogleSheets().subscribe(() => {
      this.syncingOrders = false;
      this.syncMessage = 'Orders successfully synced!';
      setTimeout(() => (this.syncMessage = ''), 4000);
      this.cdr.detectChanges();
    });
  }

  syncAll() {
    this.syncingAll = true;
    this.syncMessage = 'Syncing all data (Stocks, Orders, Customers) to Google Sheets...';
    forkJoin([
      this.ps.syncToGoogleSheets().pipe(catchError(() => of(null))),
      this.os.syncToGoogleSheets().pipe(catchError(() => of(null))),
      this.auth.syncToGoogleSheets().pipe(catchError(() => of(null))),
    ]).subscribe(() => {
      this.syncingAll = false;
      this.syncMessage = 'All services successfully synced!';
      setTimeout(() => (this.syncMessage = ''), 4000);
      this.cdr.detectChanges();
    });
  }
}
