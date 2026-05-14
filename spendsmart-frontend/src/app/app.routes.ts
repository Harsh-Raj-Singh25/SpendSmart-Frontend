import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password';
import { DashboardComponent } from './features/dashboard/dashboard';
import { PremiumComponent } from './features/premium/premium';
import { RecurringComponent } from './features/recurring/recurring';
import { TransactionsComponent } from './features/transactions/transactions';
import { BudgetsComponent } from './features/budgets/budgets';
import { CategoriesComponent } from './features/categories/categories';
import { NotificationsComponent } from './features/notifications/notifications';
import { UserManagementComponent } from './features/admin/user-management/user-management';
import { AdminDashboardComponent } from './features/admin/admin-dashboard/admin-dashboard';
import { AdminExpensesComponent } from './features/admin/admin-expenses/admin-expenses';
import { AdminIncomesComponent } from './features/admin/admin-incomes/admin-incomes';
import { AdminBudgetsComponent } from './features/admin/admin-budgets/admin-budgets';
import { ProfileComponent } from './features/auth/profile/profile';
import { AuthGuard } from './core/guards/auth-guard';
import { AdminGuard } from './core/guards/admin.guard';
import { GuestGuard } from './core/guards/guest.guard';
import { LandingComponent } from './features/landing/landing';

const routes: Routes = [
  { path: '', component: LandingComponent, canActivate: [GuestGuard] },
  { path: 'login', component: LoginComponent, canActivate: [GuestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [GuestGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [GuestGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'transactions', component: TransactionsComponent, canActivate: [AuthGuard] },
  { path: 'budgets', component: BudgetsComponent, canActivate: [AuthGuard] },
  { path: 'categories', component: CategoriesComponent, canActivate: [AuthGuard] },
  { path: 'notifications', component: NotificationsComponent, canActivate: [AuthGuard] },
  { path: 'recurring', component: RecurringComponent, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'premium', component: PremiumComponent, canActivate: [AuthGuard] },
  { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: 'admin/users', component: UserManagementComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: 'admin/expenses', component: AdminExpensesComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: 'admin/incomes', component: AdminIncomesComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: 'admin/budgets', component: AdminBudgetsComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}