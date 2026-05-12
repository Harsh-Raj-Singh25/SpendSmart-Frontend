import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface AdminUserView {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  active: boolean;
  subscriptionType?: string;
  premiumExpiresAt?: string | null;
}

export interface AdminUserCount {
  total: number;
  active: number;
}

export interface AdminCreateUserRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface AdminExpense {
  expenseId: number;
  userId: number;
  categoryId: number;
  title: string;
  amount: number;
  date: string;
  type: string;
  paymentMethod: string;
  currency?: string;
  isRecurring?: boolean;
  notes?: string;
}

export interface AdminExpenseRequest {
  userId: number;
  categoryId: number;
  title: string;
  amount: number;
  currency?: string;
  type?: string;
  paymentMethod: string;
  date: string;
  notes?: string;
  receiptUrl?: string;
  isRecurring: boolean;
}

export interface AdminIncome {
  incomeId: number;
  userId: number;
  categoryId: number;
  title: string;
  amount: number;
  date: string;
  source: string;
  currency?: string;
  isRecurring?: boolean;
  recurrencePeriod?: string;
  notes?: string;
}

export interface AdminIncomeRequest {
  userId: number;
  categoryId: number;
  title: string;
  amount: number;
  currency?: string;
  source: string;
  date: string;
  notes?: string;
  isRecurring: boolean;
  recurrencePeriod?: string;
}

export interface AdminBudget {
  budgetId: number;
  userId: number;
  categoryId: number;
  name: string;
  limitAmount: number;
  spentAmount: number;
  period: string;
  startDate: string;
  endDate: string;
  alertThreshold: number;
  isActive: boolean;
}

export interface AdminBudgetRequest {
  userId: number;
  categoryId: number;
  name: string;
  limitAmount: number;
  currency?: string;
  period: string;
  startDate: string;
  endDate: string;
  spentAmount?: number;
  alertThreshold: number;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUserCount(): Observable<AdminUserCount> {
    return this.http.get<AdminUserCount>(`${this.apiUrl}/auth/admin/users/count`);
  }

  getUsers(): Observable<AdminUserView[]> {
    return this.http.get<AdminUserView[]>(`${this.apiUrl}/auth/admin/users`);
  }

  createUser(request: AdminCreateUserRequest): Observable<AdminUserView> {
    return this.http.post<AdminUserView>(`${this.apiUrl}/auth/admin/users`, request);
  }

  suspendUser(userId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/auth/admin/users/${userId}/suspend`, {});
  }

  reactivateUser(userId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/auth/admin/users/${userId}/reactivate`, {});
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/auth/admin/users/${userId}`);
  }

  grantPremium(userId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/auth/admin/users/${userId}/premium`, {});
  }

  revokePremium(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/auth/admin/users/${userId}/premium`);
  }

  getAdminExpenses(): Observable<AdminExpense[]> {
    return this.http.get<AdminExpense[]>(`${this.apiUrl}/expenses/admin`);
  }

  createExpense(request: AdminExpenseRequest): Observable<AdminExpense> {
    return this.http.post<AdminExpense>(`${this.apiUrl}/expenses`, request);
  }

  updateExpense(expenseId: number, request: AdminExpenseRequest): Observable<AdminExpense> {
    return this.http.put<AdminExpense>(`${this.apiUrl}/expenses/${expenseId}`, request);
  }

  deleteExpense(expenseId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/expenses/${expenseId}`);
  }

  getAdminIncomes(): Observable<AdminIncome[]> {
    return this.http.get<AdminIncome[]>(`${this.apiUrl}/incomes/admin`);
  }

  createIncome(request: AdminIncomeRequest): Observable<AdminIncome> {
    return this.http.post<AdminIncome>(`${this.apiUrl}/incomes`, request);
  }

  updateIncome(incomeId: number, request: AdminIncomeRequest): Observable<AdminIncome> {
    return this.http.put<AdminIncome>(`${this.apiUrl}/incomes/${incomeId}`, request);
  }

  deleteIncome(incomeId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/incomes/${incomeId}`);
  }

  getAdminBudgets(): Observable<AdminBudget[]> {
    return this.http.get<AdminBudget[]>(`${this.apiUrl}/budgets/admin`);
  }

  createBudget(request: AdminBudgetRequest): Observable<AdminBudget> {
    return this.http.post<AdminBudget>(`${this.apiUrl}/budgets`, request);
  }

  updateBudget(budgetId: number, request: AdminBudgetRequest): Observable<AdminBudget> {
    return this.http.put<AdminBudget>(`${this.apiUrl}/budgets/${budgetId}`, request);
  }

  deleteBudget(budgetId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/budgets/${budgetId}`);
  }
}
