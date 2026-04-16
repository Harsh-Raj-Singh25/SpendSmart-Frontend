import { Component, OnInit } from '@angular/core';
import { TransactionService, Transaction } from '../../core/services/transaction.service';
import { AuthService } from '../../core/services/auth';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  income = 0;
  expense = 0;
  balance = 0;
  trend = 0;

  selectedType: 'ALL' | 'INCOME' | 'EXPENSE' = 'ALL';
  searchTerm = '';

  quickAmount = 0;
  quickDescription = '';
  quickType: 'INCOME' | 'EXPENSE' = 'EXPENSE';

  isPremium = false;
  private userId: number | null = null;

  constructor(
    public transactionService: TransactionService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userId = user.userId;
      this.isPremium = user.subscriptionType === 'PREMIUM';
    }
    this.loadTransactions();
  }

  loadTransactions() {
    if (!this.userId) {
      this.transactions = [];
      this.applyFilters();
      return;
    }

    forkJoin([
      this.transactionService.getExpensesByUser(this.userId),
      this.transactionService.getIncomesByUser(this.userId)
    ]).subscribe({
      next: ([expenses, incomes]) => {
        const mappedExpenses: Transaction[] = (expenses || []).map((e: any) => ({
          id: Number(e.expenseId),
          backendId: Number(e.expenseId),
          amount: Number(e.amount || 0),
          category: `Category #${e.categoryId ?? '-'}`,
          description: e.title || e.notes || 'Expense',
          date: e.date,
          type: 'EXPENSE'
        }));

        const mappedIncomes: Transaction[] = (incomes || []).map((i: any) => ({
          id: Number(i.incomeId),
          backendId: Number(i.incomeId),
          amount: Number(i.amount || 0),
          category: `Category #${i.categoryId ?? '-'}`,
          description: i.title || i.notes || 'Income',
          date: i.date,
          type: 'INCOME'
        }));

        this.transactions = [...mappedExpenses, ...mappedIncomes]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        this.calculateSummary();
        this.updateDailyCount();
        this.applyFilters();
      },
      error: () => {
        this.transactions = [];
        this.calculateSummary();
        this.updateDailyCount();
        this.applyFilters();
      }
    });
  }

  calculateSummary() {
    this.income = this.transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
    this.expense = this.transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
    this.balance = this.income - this.expense;

    if (this.expense === 0) {
      this.trend = 100;
      return;
    }
    this.trend = Number((((this.income - this.expense) / this.expense) * 100).toFixed(1));
  }

  applyFilters() {
    const normalizedSearch = this.searchTerm.trim().toLowerCase();

    this.filteredTransactions = this.transactions.filter(tx => {
      const typeMatch = this.selectedType === 'ALL' || tx.type === this.selectedType;
      const searchMatch = !normalizedSearch
        || tx.description.toLowerCase().includes(normalizedSearch)
        || tx.category.toLowerCase().includes(normalizedSearch);
      return typeMatch && searchMatch;
    });
  }

  setTypeFilter(filter: 'ALL' | 'INCOME' | 'EXPENSE') {
    this.selectedType = filter;
    this.applyFilters();
  }

  onSearchChange(value: string) {
    this.searchTerm = value;
    this.applyFilters();
  }

  addQuickTransaction() {
    if (!this.userId || this.quickAmount <= 0 || !this.quickDescription.trim()) {
      return;
    }

    const payloadBase = {
      userId: this.userId,
      categoryId: 1,
      title: this.quickDescription.trim(),
      amount: this.quickAmount,
      currency: 'INR',
      date: new Date().toISOString().split('T')[0],
      notes: this.quickDescription.trim(),
      isRecurring: false
    };

    const request$ = this.quickType === 'EXPENSE'
      ? this.transactionService.addExpense({
          ...payloadBase,
          type: 'EXPENSE',
          paymentMethod: 'UPI'
        })
      : this.transactionService.addIncome({
          ...payloadBase,
          source: 'OTHER',
          recurrencePeriod: null
        });

    request$.subscribe({
      next: () => {
        this.quickAmount = 0;
        this.quickDescription = '';
        this.loadTransactions();
      }
    });
  }

  removeTransaction(tx: Transaction) {
    const confirmed = window.confirm('Delete this transaction?');
    if (!confirmed || !tx.backendId) {
      return;
    }

    const request$ = tx.type === 'EXPENSE'
      ? this.transactionService.deleteExpense(tx.backendId)
      : this.transactionService.deleteIncome(tx.backendId);

    request$.subscribe({
      next: () => this.loadTransactions()
    });
  }

  private updateDailyCount() {
    const today = new Date().toISOString().split('T')[0];
    const todayCount = this.transactions.filter(tx => String(tx.date).startsWith(today)).length;
    this.transactionService.dailyTransactionCount.set(todayCount);
  }
}
