import { Component, OnInit } from '@angular/core';
import { AdminIncome, AdminIncomeRequest, AdminService } from '../../../core/services/admin.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-admin-incomes',
  standalone: false,
  templateUrl: './admin-incomes.html',
  styleUrls: ['./admin-incomes.scss']
})
export class AdminIncomesComponent implements OnInit {
  incomes: AdminIncome[] = [];
  loading = true;
  saving = false;
  editingIncomeId: number | null = null;

  readonly sources = ['SALARY', 'BUSINESS', 'INVESTMENT', 'FREELANCE', 'RENTAL', 'BONUS', 'OTHER'];
  readonly recurrencePeriods = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];

  form: AdminIncomeRequest = {
    userId: 0,
    categoryId: 0,
    title: '',
    amount: 0,
    currency: 'INR',
    source: 'SALARY',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
    isRecurring: false,
    recurrencePeriod: ''
  };

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadIncomes();
  }

  loadIncomes() {
    this.loading = true;
    this.adminService.getAdminIncomes().pipe(catchError(() => of([]))).subscribe(list => {
      this.incomes = list || [];
      this.loading = false;
    });
  }

  startEdit(income: AdminIncome) {
    this.editingIncomeId = income.incomeId;
    this.form = {
      userId: income.userId,
      categoryId: income.categoryId,
      title: income.title || '',
      amount: Number(income.amount || 0),
      currency: income.currency || 'INR',
      source: income.source || 'SALARY',
      date: income.date,
      notes: income.notes || '',
      isRecurring: !!income.isRecurring,
      recurrencePeriod: income.recurrencePeriod || ''
    };
  }

  cancelEdit() {
    this.editingIncomeId = null;
    this.resetForm();
  }

  submit() {
    if (!this.isFormValid()) {
      return;
    }

    this.saving = true;
    const request: AdminIncomeRequest = {
      ...this.form,
      userId: Number(this.form.userId),
      categoryId: Number(this.form.categoryId),
      amount: Number(this.form.amount),
      recurrencePeriod: this.form.isRecurring ? this.form.recurrencePeriod : ''
    };

    const call$ = this.editingIncomeId
      ? this.adminService.updateIncome(this.editingIncomeId, request)
      : this.adminService.createIncome(request);

    call$.subscribe({
      next: () => {
        this.saving = false;
        this.cancelEdit();
        this.loadIncomes();
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  delete(income: AdminIncome) {
    const confirmed = window.confirm(`Delete income #${income.incomeId}?`);
    if (!confirmed) {
      return;
    }

    this.adminService.deleteIncome(income.incomeId).subscribe({
      next: () => {
        this.incomes = this.incomes.filter(i => i.incomeId !== income.incomeId);
      }
    });
  }

  private isFormValid(): boolean {
    const recurringValidity = !this.form.isRecurring || !!this.form.recurrencePeriod;
    return !!(
      this.form.userId &&
      this.form.categoryId &&
      this.form.title?.trim() &&
      this.form.amount > 0 &&
      this.form.date &&
      this.form.source &&
      recurringValidity
    );
  }

  private resetForm() {
    this.form = {
      userId: 0,
      categoryId: 0,
      title: '',
      amount: 0,
      currency: 'INR',
      source: 'SALARY',
      date: new Date().toISOString().slice(0, 10),
      notes: '',
      isRecurring: false,
      recurrencePeriod: ''
    };
  }
}
