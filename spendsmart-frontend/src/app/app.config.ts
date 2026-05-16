import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AppRoutingModule } from './app.routes';
import { AppComponent } from './app';
import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password';
import { DashboardComponent } from './features/dashboard/dashboard';
import { PremiumComponent } from './features/premium/premium';
import { RecurringComponent } from './features/recurring/recurring';
import { TransactionsComponent } from './features/transactions/transactions';
import { BudgetsComponent } from './features/budgets/budgets';
import { NotificationsComponent } from './features/notifications/notifications';
import { CategoriesComponent } from './features/categories/categories';
import { UserManagementComponent } from './features/admin/user-management/user-management';
import { AdminDashboardComponent } from './features/admin/admin-dashboard/admin-dashboard';
import { AdminExpensesComponent } from './features/admin/admin-expenses/admin-expenses';
import { AdminIncomesComponent } from './features/admin/admin-incomes/admin-incomes';
import { AdminBudgetsComponent } from './features/admin/admin-budgets/admin-budgets';
import { ProfileComponent } from './features/auth/profile/profile';
import { NavbarComponent } from './shared/components/navbar/navbar';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog';
import { JwtInterceptor } from './core/interceptors/jwt-interceptor';
import { LandingComponent } from './features/landing/landing';

@NgModule({
  declarations: [
    AppComponent, LandingComponent, LoginComponent, NavbarComponent, RegisterComponent, ForgotPasswordComponent, DashboardComponent, NotificationsComponent, RecurringComponent, TransactionsComponent, BudgetsComponent, PremiumComponent, UserManagementComponent, ProfileComponent, AdminDashboardComponent, AdminExpensesComponent, AdminIncomesComponent, AdminBudgetsComponent, ConfirmDialogComponent, CategoriesComponent
  ],
  imports: [
    BrowserModule, BrowserAnimationsModule, HttpClientModule,
    ReactiveFormsModule, FormsModule, AppRoutingModule,
    MatInputModule, MatButtonModule, MatCardModule,
    MatToolbarModule, MatSnackBarModule, MatProgressSpinnerModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}