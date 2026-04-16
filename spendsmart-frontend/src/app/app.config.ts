import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
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
import { UserManagementComponent } from './features/admin/user-management/user-management';
// import { ProfileComponent } from './features/auth/profile/profile';
import { NavbarComponent } from './shared/components/navbar/navbar';
import { JwtInterceptor } from './core/interceptors/jwt-interceptor';

@NgModule({
  declarations: [
    AppComponent, LoginComponent, NavbarComponent, RegisterComponent, ForgotPasswordComponent, DashboardComponent, PremiumComponent, UserManagementComponent//, ProfileComponent
  ],
  imports: [
    BrowserModule, BrowserAnimationsModule, HttpClientModule,
    ReactiveFormsModule, AppRoutingModule,
    MatInputModule, MatButtonModule, MatCardModule,
    MatToolbarModule, MatSnackBarModule, MatProgressSpinnerModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}