import { Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProductListComponent } from './components/product-list/product-list.component';
import { ProductCategoryComponent } from './components/product-category/product-category.component';
import { ProductPageComponent } from './components/product-page/product-page.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { AdminComponent } from './components/admin/admin.component';
import { NewArrivalsComponent } from './components/new-arrivals/new-arrivals.component';
import { BestSellersComponent } from './components/best-sellers/best-sellers.component';

export const routes: Routes = [
  { path: '', component: ProductListComponent },
  { path: 'category/:category', component: ProductCategoryComponent },
  { path: 'product/:id', component: ProductPageComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'admin', component: AdminComponent },
  { path: 'new-arrivals', component: NewArrivalsComponent },
  { path: 'best-sellers', component: BestSellersComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
