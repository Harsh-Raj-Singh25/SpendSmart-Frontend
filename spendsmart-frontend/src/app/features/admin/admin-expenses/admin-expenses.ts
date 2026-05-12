import { Component, OnInit } from '@angular/core';
import { AdminExpense, AdminExpenseRequest, AdminService } from '../../../core/services/admin.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-admin-expenses',
  standalone: false,
  templateUrl: './admin-expenses.html',
  styleUrls: ['./admin-expenses.scss']
})
export class AdminExpensesComponent implements OnInit {
  expenses: AdminExpense[] = [];
  loading = true;
  saving = false;
  editingExpenseId: number | null = null;

  readonly expenseTypes = ['FOOD', 'TRANSPORT', 'BILLS', 'HEALTHCARE', 'ENTERTAINMENT', 'SHOPPING', 'OTHER'];
  readonly paymentMethods = ['CASH', 'UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'NET_BANKING', 'WALLET'];

  form: AdminExpenseRequest = {
    userId: 0,
    categoryId: 0,
    title: '',
    amount: 0,
    currency: 'INR',
    type: 'OTHER',
    paymentMethod: 'UPI',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
    isRecurring: false
  };

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadExpenses();
  }

  loadExpenses() {
    this.loading = true;
    this.adminService.getAdminExpenses().pipe(catchError(() => of([]))).subscribe(list => {
      this.expenses = list || [];
      this.loading = false;
    });
  }

  startEdit(expense: AdminExpense) {
    this.editingExpenseId = expense.expenseId;
    this.form = {
      userId: expense.userId,
      categoryId: expense.categoryId,
      title: expense.title || '',
      amount: Number(expense.amount || 0),
      currency: expense.currency || 'INR',
      type: expense.type || 'OTHER',
      paymentMethod: expense.paymentMethod || 'UPI',
      date: expense.date,
      notes: expense.notes || '',
      isRecurring: !!expense.isRecurring
    };
  }

  cancelEdit() {
    this.editingExpenseId = null;
    this.resetForm();
  }

  submit() {
    if (!this.isFormValid()) {
      return;
    }

    this.saving = true;
    const request: AdminExpenseRequest = {
      ...this.form,
      userId: Number(this.form.userId),
      categoryId: Number(this.form.categoryId),
      amount: Number(this.form.amount)
    };

    const call$ = this.editingExpenseId
      ? this.adminService.updateExpense(this.editingExpenseId, request)
      : this.adminService.createExpense(request);

    call$.subscribe({
      next: () => {
        this.saving = false;
        this.cancelEdit();
        this.loadExpenses();
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  delete(expense: AdminExpense) {
    const confirmed = window.confirm(`Delete expense #${expense.expenseId}?`);
    if (!confirmed) {
      return;
    }

    this.adminService.deleteExpense(expense.expenseId).subscribe({
      next: () => {
        this.expenses = this.expenses.filter(e => e.expenseId !== expense.expenseId);
      }
    });
  }

  private isFormValid(): boolean {
    return !!(
      this.form.userId &&
      this.form.categoryId &&
      this.form.title?.trim() &&
      this.form.amount > 0 &&
      this.form.date &&
      this.form.paymentMethod
    );
  }

  private resetForm() {
    this.form = {
      userId: 0,
      categoryId: 0,
      title: '',
      amount: 0,
      currency: 'INR',
      type: 'OTHER',
      paymentMethod: 'UPI',
      date: new Date().toISOString().slice(0, 10),
      notes: '',
      isRecurring: false
    };
  }
}
