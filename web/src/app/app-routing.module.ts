import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { MenuComponent } from './pages/menu/menu.component';
import { ProductDetailsComponent } from './pages/product-details/product-details.component';
import { CartComponent } from './pages/cart/cart.component';
import { OrderStatusComponent } from './pages/order-status/order-status.component';
import { LayoutComponent } from './components/layout/layout.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { LayoutAdminComponent } from './components/layout-admin/layout-admin.component';
import { DashboardComponent } from './pages/admin/dashboard/dashboard.component';
import { SignInComponent } from './pages/admin/sign-in/sign-in.component';
import { OrdersComponent } from './pages/admin/orders/orders.component';
import { MenuItemsComponent } from './pages/admin/menu-items/menu-items.component';
import { authGuard } from './guards/auth.guard';
import { GuestComponent } from './pages/guest/guest.component';

const routes: Routes = [
  { 
    path: '', 
    component: HomeComponent,
  },
  { path: 'guest/:token', component: GuestComponent },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'menu', component: MenuComponent },
      // { path: 'product/:id', component: ProductDetailsComponent },
      
      { path: 'cart', component: CartComponent },
      { path: 'status', component: OrderStatusComponent },
    ],
  },
  {
    path: 'admin/sign-in',
    component: SignInComponent
  },
  {
    path: 'admin',
    component: LayoutAdminComponent,
    canActivate: [authGuard], // protege rotas de admin se não estiver logado (middleware)
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'orders',
        component: OrdersComponent
      },
      {
        path: 'menu-items',
        component: MenuItemsComponent
      }
    ]
  },
  {
    path: '**',
    component: NotFoundComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
