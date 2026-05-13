import { Component, OnInit } from '@angular/core';
import { AdminExpense, AdminExpenseRequest, AdminService } from '../../../core/services/admin.service';
import { ModalService } from '../../../shared/services/modal.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

type AdminExpenseForm = Omit<AdminExpenseRequest, 'userId' | 'categoryId' | 'amount' | 'type' | 'paymentMethod'> & {
  userId: number | null;
  categoryId: number | null;
  amount: number | null;
  type: string;
  paymentMethod: string;
};

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

  form: AdminExpenseForm = {
    userId: null,
    categoryId: null,
    title: '',
    amount: null,
    currency: 'INR',
    type: '',
    paymentMethod: '',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
    isRecurring: false
  };

  constructor(private adminService: AdminService, private modalService: ModalService) {}

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
    this.modalService.confirm({
      title: 'Delete Expense',
      message: `Delete expense #${expense.expenseId}?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmClass: 'danger'
    }).then(confirmed => {
      if (!confirmed) return;
      this.adminService.deleteExpense(expense.expenseId).subscribe({
        next: () => {
          this.expenses = this.expenses.filter(e => e.expenseId !== expense.expenseId);
        }
      });
    });
  }

  private isFormValid(): boolean {
    return !!(
      this.form.userId &&
      this.form.categoryId &&
      this.form.title?.trim() &&
      Number(this.form.amount ?? 0) > 0 &&
      this.form.date &&
      this.form.paymentMethod
    );
  }

  private resetForm() {
    this.form = {
      userId: null,
      categoryId: null,
      title: '',
      amount: null,
      currency: 'INR',
      type: '',
      paymentMethod: '',
      date: new Date().toISOString().slice(0, 10),
      notes: '',
      isRecurring: false
    };
  }
}
