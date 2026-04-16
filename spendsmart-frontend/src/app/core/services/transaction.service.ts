import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Transaction {
  id?: number;
  backendId?: number;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private http = inject(HttpClient);
  
  recentTransactions = signal<Transaction[]>([]);
  dailyTransactionCount = signal<number>(0);
  
  // 7 translations free limit
  FREE_DAILY_LIMIT = 7;

  getExpensesByUser(userId: number) {
    return this.http.get<any[]>(`${environment.apiUrl}/expenses/user/${userId}`);
  }

  getIncomesByUser(userId: number) {
    return this.http.get<any[]>(`${environment.apiUrl}/incomes/user/${userId}`);
  }

  addExpense(expense: any) {
    return this.http.post(`${environment.apiUrl}/expenses`, expense);
  }

  addIncome(income: any) {
    return this.http.post(`${environment.apiUrl}/incomes`, income);
  }

  deleteExpense(expenseId: number) {
    return this.http.delete(`${environment.apiUrl}/expenses/${expenseId}`);
  }

  deleteIncome(incomeId: number) {
    return this.http.delete(`${environment.apiUrl}/incomes/${incomeId}`);
  }

  checkDailyLimit(): boolean {
    return this.dailyTransactionCount() < this.FREE_DAILY_LIMIT;
  }
}
