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
  styleUrls: ['./admin.component.css', '../../../styles.css'],
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
  private productsSubscription!: Subscription;

  selectedOrderIds: Set<string> = new Set();
  selectedReceiptIds: Set<string> = new Set();

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
    if (this.ordersSubscription) this.ordersSubscription.unsubscribe();
    if (this.productsSubscription) this.productsSubscription.unsubscribe();
  }

  refreshData() {
    if (this.activeTab === 'stocks') {
      this.loadProducts();
    } else if (this.activeTab === 'orders' || this.activeTab === 'receipts') {
      this.loadOrders();
    } else if (this.activeTab === 'users') {
      this.loadUsers();
    }
  }

  switchTab(tab: 'stocks' | 'orders' | 'receipts' | 'users' | 'sync') {
    this.activeTab = tab;
    this.refreshData();
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
      alert(
        'Veuillez apporter une modification au prix ou à la quantité, ou bien annuler la modification.',
      );
      return;
    }
    if (!confirm(`Êtes-vous sûr de vouloir modifier ${this.selectedProductIds.size} produits ?`))
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

    if (typeof this.ps.refreshProducts === 'function') {
      this.ps.refreshProducts();
    }

    if (this.productsSubscription) {
      this.productsSubscription.unsubscribe();
    }

    this.productsSubscription = this.ps.getProducts().subscribe({
      next: (p) => {
        this.currentProducts = p || [];
        this.products$.next(this.currentProducts);
        this.extractCategories(this.currentProducts);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = "Échec, les produits n'ont pas pu être chargés.";
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

    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        this.error = 'Le nom, le prix et la catégorie du produit sont obligatoires.';
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

  deleteSelectedProducts() {
    if (this.selectedProductIds.size === 0) return;

    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer DÉFINITIVEMENT ${this.selectedProductIds.size} produit(s) ?`,
      )
    ) {
      return;
    }

    this.massUpdating = true;

    const deleteRequests = Array.from(this.selectedProductIds).map((id) =>
      this.ps.deleteProduct(id).pipe(catchError(() => of(null))),
    );

    forkJoin(deleteRequests).subscribe(() => {
      this.massUpdating = false;
      this.selectedProductIds.clear();
      this.massEditPrice = null;
      this.massEditQuantity = null;
      setTimeout(() => {
        this.loadProducts();
      }, 1000);
    });
  }

  goToProduct(product: any) {
    //if (product.quantity < 10) return;
    this.router.navigate(['/product', product.id]);
  }

  deleteProduct(id: string): void {
    if (!confirm('Voulez-vous vraiment supprimer ce produit ?')) return;
    this.ps.deleteProduct(id).subscribe({
      next: () => this.loadProducts(),
    });
  }

  toggleOrderSelection(orderId: string) {
    if (this.selectedOrderIds.has(orderId)) {
      this.selectedOrderIds.delete(orderId);
    } else {
      this.selectedOrderIds.add(orderId);
    }
  }

  toggleSelectAllOrders() {
    const displayedOrders = this.getFilteredOrders();
    if (this.selectedOrderIds.size === displayedOrders.length && displayedOrders.length > 0) {
      this.selectedOrderIds.clear();
    } else {
      displayedOrders.forEach((o) => this.selectedOrderIds.add(o.id));
    }
  }

  deleteSelectedOrders() {
    if (this.selectedOrderIds.size === 0) return;

    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer DÉFINITIVEMENT ${this.selectedOrderIds.size} commande(s) ?`,
      )
    ) {
      return;
    }

    this.ordersLoading = true;

    const deleteRequests = Array.from(this.selectedOrderIds).map((id) =>
      this.os.deleteOrder(id).pipe(catchError(() => of(null))),
    );

    forkJoin(deleteRequests).subscribe(() => {
      this.selectedOrderIds.clear();
      setTimeout(() => {
        this.loadOrders();
      }, 1000);
    });
  }

  loadOrders(): void {
    this.ordersLoading = true;

    if (typeof this.os.refreshOrders === 'function') {
      this.os.refreshOrders();
    }

    if (this.ordersSubscription) {
      this.ordersSubscription.unsubscribe();
    }

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
    if (confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
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
                <title>Ticket de Caisse - ${receipt.id}</title>
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

  toggleReceiptSelection(receiptId: string) {
    if (this.selectedReceiptIds.has(receiptId)) {
      this.selectedReceiptIds.delete(receiptId);
    } else {
      this.selectedReceiptIds.add(receiptId);
    }
  }

  toggleSelectAllReceipts() {
    const displayedReceipts = this.getFilteredReceipts();
    if (this.selectedReceiptIds.size === displayedReceipts.length && displayedReceipts.length > 0) {
      this.selectedReceiptIds.clear();
    } else {
      displayedReceipts.forEach((r) => this.selectedReceiptIds.add(r.id));
    }
  }

  deleteSelectedReceipts() {
    if (this.selectedReceiptIds.size === 0) return;

    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer DÉFINITIVEMENT ${this.selectedReceiptIds.size} ticket(s) de caisse ?`,
      )
    ) {
      return;
    }

    this.ordersLoading = true;

    const deleteRequests = Array.from(this.selectedReceiptIds).map((id) =>
      this.os.deleteOrder(id).pipe(catchError(() => of(null))),
    );

    forkJoin(deleteRequests).subscribe(() => {
      this.selectedReceiptIds.clear();
      setTimeout(() => {
        this.loadOrders();
      }, 1000);
    });
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
    const action = isPromoting
      ? 'rendre cet utilisateur admin'
      : 'retirer les droits admin de cet utilisateur';

    if (!confirm(`Êtes-vous sûr de vouloir ${action} ?`)) {
      return;
    }

    const updatedUser = {
      ...user,
      admin: isPromoting,
    };

    this.auth.updateUser(user.id, updatedUser).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err) => {
        console.error('Update failed:', err);
        alert('La modification du rôle a échoué. Vérifiez la console.');
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
      alert("L'email est requis !");
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
        alert(err.error?.error || "La modification de l'utilisateur a échoué.");
      },
    });
  }

  deleteUser(userId: string) {
    if (
      !confirm(
        'Êtes-vous SÛR de vouloir supprimer cet utilisateur ? La suppression est DÉFINITIVE.',
      )
    )
      return;

    this.auth.deleteUser(userId).subscribe({
      next: () => this.loadUsers(),
      error: () => alert("La suppression de l'utilisateur a échoué."),
    });
  }

  syncProducts() {
    this.syncingProducts = true;
    this.syncMessage = 'Synchronisation des produits avec Google Sheets...';
    this.ps.syncToGoogleSheets().subscribe(() => {
      this.syncingProducts = false;
      this.syncMessage = 'Produits synchronisés avec succès !';
      setTimeout(() => (this.syncMessage = ''), 4000);
      this.cdr.detectChanges();
    });
  }

  syncOrders() {
    this.syncingOrders = true;
    this.syncMessage = 'Synchronisation des commandes avec Google Sheets...';
    this.os.syncToGoogleSheets().subscribe(() => {
      this.syncingOrders = false;
      this.syncMessage = 'Commandes synchronisées avec succès !';
      setTimeout(() => (this.syncMessage = ''), 4000);
      this.cdr.detectChanges();
    });
  }

  syncAll() {
    this.syncingAll = true;
    this.syncMessage =
      'Synchronisation de toutes les données (produits, commandes, clients) avec Google Sheets...';
    forkJoin([
      this.ps.syncToGoogleSheets().pipe(catchError(() => of(null))),
      this.os.syncToGoogleSheets().pipe(catchError(() => of(null))),
      this.auth.syncToGoogleSheets().pipe(catchError(() => of(null))),
    ]).subscribe(() => {
      this.syncingAll = false;
      this.syncMessage = 'Toutes les données sont synchronisées.';
      setTimeout(() => (this.syncMessage = ''), 4000);
      this.cdr.detectChanges();
    });
  }
}
