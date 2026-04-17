import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface Budget {
  budgetId?: number;
  userId: number;
  categoryId: number;
  name: string;
  limitAmount: number;
  currency: string;
  period: 'MONTHLY' | 'WEEKLY' | 'YEARLY';
  startDate: string;
  endDate: string;
  spentAmount?: number;
  alertThreshold: number;
  isActive?: boolean;
}

export interface BudgetProgress {
  budgetId: number;
  limitAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  alertStatus: 'SAFE' | 'WARNING' | 'EXCEEDED';
}

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}/budgets`;

  /**
   * Create a new budget.
   */
  createBudget(budget: Budget): Observable<Budget> {
    return this.http.post<Budget>(this.BASE, budget);
  }

  /**
   * Get all budgets for a user.
   */
  getByUser(userId: number): Observable<Budget[]> {
    return this.http.get<Budget[]>(`${this.BASE}/user/${userId}`);
  }

  /**
   * Get active budgets for a user.
   */
  getActiveBudgets(userId: number): Observable<Budget[]> {
    return this.http.get<Budget[]>(`${this.BASE}/user/${userId}/active`);
  }

  /**
   * Get progress for a specific budget.
   */
  getProgress(budgetId: number): Observable<BudgetProgress> {
    return this.http.get<BudgetProgress>(`${this.BASE}/${budgetId}/progress`);
  }

  /**
   * Get budget alerts for a user.
   */
  getAlerts(userId: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.BASE}/user/${userId}/alerts`);
  }

  /**
   * Update a budget.
   */
  updateBudget(budgetId: number, budget: Budget): Observable<Budget> {
    return this.http.put<Budget>(`${this.BASE}/${budgetId}`, budget);
  }

  /**
   * Delete a budget.
   */
  deleteBudget(budgetId: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${budgetId}`);
  }
}
