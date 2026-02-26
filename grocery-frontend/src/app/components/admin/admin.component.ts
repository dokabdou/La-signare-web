import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // <-- Add ChangeDetectorRef
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReplaySubject } from 'rxjs';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
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

  constructor(
    private ps: ProductService,
    private router: Router,
    private cdr: ChangeDetectorRef, // <-- Inject ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imageUrl = reader.result as string;
        // FIX: Force Angular to update the UI instantly when the image finishes loading
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.ps.getProducts().subscribe({
      next: (p) => {
        const products = p || [];
        this.products$.next(products);
        this.extractCategories(products);
        this.loading = false;

        // FIX: Force UI refresh when new products arrive
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load products in admin:', err);
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
          this.load();
        },
        error: (err) => console.error('Failed to update product:', err),
      });
    } else {
      this.ps.createProduct(payload).subscribe({
        next: () => {
          this.cancelEdit(); // Clears all inputs
          this.load();
        },
        error: (err) => console.error('Failed to create product:', err),
      });
    }
  }

  goToProduct(id: string) {
    this.router.navigate(['/product', id]);
  }

  deleteProduct(id: string): void {
    if (!confirm('Delete this product?')) return;
    this.ps.deleteProduct(id).subscribe({
      next: () => this.load(),
      error: (err) => console.error('Failed to delete product:', err),
    });
  }
}
