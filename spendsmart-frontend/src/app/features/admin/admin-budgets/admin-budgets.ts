import { Component, OnInit } from '@angular/core';
import { AdminBudget, AdminBudgetRequest, AdminService } from '../../../core/services/admin.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-admin-budgets',
  standalone: false,
  templateUrl: './admin-budgets.html',
  styleUrls: ['./admin-budgets.scss']
})
export class AdminBudgetsComponent implements OnInit {
  budgets: AdminBudget[] = [];
  loading = true;
  saving = false;
  editingBudgetId: number | null = null;

  readonly periods = ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'];

  form: AdminBudgetRequest = {
    userId: 0,
    categoryId: 0,
    name: '',
    limitAmount: 0,
    currency: 'INR',
    period: 'MONTHLY',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    spentAmount: 0,
    alertThreshold: 80,
    isActive: true
  };

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadBudgets();
  }

  loadBudgets() {
    this.loading = true;
    this.adminService.getAdminBudgets().pipe(catchError(() => of([]))).subscribe(list => {
      this.budgets = list || [];
      this.loading = false;
    });
  }

  startEdit(budget: AdminBudget) {
    this.editingBudgetId = budget.budgetId;
    this.form = {
      userId: budget.userId,
      categoryId: budget.categoryId,
      name: budget.name,
      limitAmount: Number(budget.limitAmount || 0),
      currency: 'INR',
      period: budget.period || 'MONTHLY',
      startDate: budget.startDate,
      endDate: budget.endDate,
      spentAmount: Number(budget.spentAmount || 0),
      alertThreshold: Number(budget.alertThreshold || 80),
      isActive: budget.isActive
    };
  }

  cancelEdit() {
    this.editingBudgetId = null;
    this.resetForm();
  }

  submit() {
    if (!this.isFormValid()) {
      return;
    }

    this.saving = true;
    const request: AdminBudgetRequest = {
      ...this.form,
      userId: Number(this.form.userId),
      categoryId: Number(this.form.categoryId),
      limitAmount: Number(this.form.limitAmount),
      spentAmount: Number(this.form.spentAmount || 0),
      alertThreshold: Number(this.form.alertThreshold)
    };

    const call$ = this.editingBudgetId
      ? this.adminService.updateBudget(this.editingBudgetId, request)
      : this.adminService.createBudget(request);

    call$.subscribe({
      next: () => {
        this.saving = false;
        this.cancelEdit();
        this.loadBudgets();
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  delete(budget: AdminBudget) {
    const confirmed = window.confirm(`Delete budget #${budget.budgetId}?`);
    if (!confirmed) {
      return;
    }

    this.adminService.deleteBudget(budget.budgetId).subscribe({
      next: () => {
        this.budgets = this.budgets.filter(b => b.budgetId !== budget.budgetId);
      }
    });
  }

  private isFormValid(): boolean {
    return !!(
      this.form.userId &&
      this.form.categoryId &&
      this.form.name?.trim() &&
      this.form.limitAmount > 0 &&
      this.form.period &&
      this.form.startDate &&
      this.form.endDate
    );
  }

  private resetForm() {
    const now = new Date().toISOString().slice(0, 10);
    this.form = {
      userId: 0,
      categoryId: 0,
      name: '',
      limitAmount: 0,
      currency: 'INR',
      period: 'MONTHLY',
      startDate: now,
      endDate: now,
      spentAmount: 0,
      alertThreshold: 80,
      isActive: true
    };
  }
}
