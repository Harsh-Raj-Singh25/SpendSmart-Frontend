import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth';
import { Budget, BudgetProgress, BudgetService } from '../../core/services/budget.service';
import { Category, CategoryService } from '../../core/services/category.service';
import { ModalService } from '../../shared/services/modal.service';

type BudgetCard = {
  budget: Budget;
  progress: BudgetProgress | null;
  categoryName: string;
};

@Component({
  selector: 'app-budgets',
  standalone: false,
  templateUrl: './budgets.html',
  styleUrls: ['./budgets.scss']
})
export class BudgetsComponent implements OnInit {
  form: FormGroup;
  userId: number | null = null;
  categories: Category[] = [];
  expenseCategories: Category[] = [];
  budgetCards: BudgetCard[] = [];
  loading = false;
  submitting = false;

  readonly periods: Budget['period'][] = ['WEEKLY', 'MONTHLY', 'YEARLY'];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private categoryService: CategoryService,
    private budgetService: BudgetService,
    private snackBar: MatSnackBar,
    private modalService: ModalService
  ) {
    const today = new Date();
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.form = this.fb.group({
      categoryId: [null, Validators.required],
      name: ['', Validators.required],
      limitAmount: [null, [Validators.required, Validators.min(0.01)]],
      alertThreshold: [85, [Validators.required, Validators.min(0), Validators.max(100)]],
      period: ['MONTHLY', Validators.required],
      startDate: [today.toISOString().split('T')[0], Validators.required],
      endDate: [monthEnd.toISOString().split('T')[0], Validators.required],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user?.userId) {
      this.snackBar.open('Session expired. Please login again.', 'Close', { duration: 3000 });
      return;
    }

    this.userId = user.userId;
    this.loadCategoriesAndBudgets();

    this.form.get('categoryId')?.valueChanges.subscribe((categoryId) => {
      const category = this.expenseCategories.find(c => c.categoryId === Number(categoryId));
      if (category && !this.form.get('name')?.value) {
        this.form.patchValue({ name: `${category.name} Budget` });
      }
    });
  }

  private loadCategoriesAndBudgets(): void {
    if (!this.userId) return;

    this.categoryService.getByUserId(this.userId).subscribe({
      next: (cats) => {
        if (!cats || cats.length === 0) {
          this.categoryService.initDefaults(this.userId!).subscribe({
            next: () => this.loadCategoriesAndBudgets(),
            error: () => {
              this.categories = [];
              this.expenseCategories = [];
              this.loadBudgets();
            }
          });
          return;
        }

        this.categories = cats;
        this.expenseCategories = cats.filter(c => c.type === 'EXPENSE');
        this.loadBudgets();
      },
      error: () => {
        this.categories = [];
        this.expenseCategories = [];
        this.loadBudgets();
      }
    });
  }

  loadBudgets(): void {
    if (!this.userId) return;

    this.loading = true;
    this.budgetService.getByUser(this.userId).subscribe({
      next: (budgets) => {
        const list = budgets || [];
        if (list.length === 0) {
          this.budgetCards = [];
          this.loading = false;
          return;
        }

        forkJoin(
          list.map(budget =>
            this.budgetService.getProgress(budget.budgetId!).pipe(
              catchError(() => of(null))
            )
          )
        ).subscribe({
          next: (progressList) => {
            this.budgetCards = list
              .map((budget, index) => ({
                budget,
                progress: progressList[index],
                categoryName: this.getCategoryName(budget.categoryId)
              }))
              .sort((a, b) => (b.budget.budgetId || 0) - (a.budget.budgetId || 0));
            this.loading = false;
          },
          error: () => {
            this.budgetCards = list
              .map((budget) => ({
                budget,
                progress: null,
                categoryName: this.getCategoryName(budget.categoryId)
              }))
              .sort((a, b) => (b.budget.budgetId || 0) - (a.budget.budgetId || 0));
            this.loading = false;
          }
        });
      },
      error: () => {
        this.budgetCards = [];
        this.loading = false;
      }
    });
  }

  submit(): void {
    if (!this.userId) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;
    const payload: Budget = {
      userId: this.userId,
      categoryId: Number(raw.categoryId),
      name: String(raw.name).trim(),
      limitAmount: Number(raw.limitAmount),
      currency: 'INR',
      period: raw.period,
      startDate: raw.startDate,
      endDate: raw.endDate,
      spentAmount: 0,
      alertThreshold: Number(raw.alertThreshold ?? 85),
      isActive: !!raw.isActive
    };

    this.submitting = true;
    this.budgetService.createBudget(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.snackBar.open('Budget created successfully', 'Close', { duration: 2500 });
        this.form.patchValue({
          categoryId: null,
          name: '',
          limitAmount: null,
          alertThreshold: 85,
          period: 'MONTHLY',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
          isActive: true
        });
        this.loadBudgets();
      },
      error: (err) => {
        this.submitting = false;
        this.snackBar.open(err.error?.message || 'Could not create budget', 'Close', { duration: 3000 });
      }
    });
  }

  removeBudget(budget: Budget): void {
    if (!budget.budgetId) return;

    this.modalService.confirm({
      title: 'Delete Budget',
      message: `Delete ${budget.name}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmClass: 'danger'
    }).then(confirmed => {
      if (!confirmed) return;

      this.budgetService.deleteBudget(budget.budgetId!).subscribe({
        next: () => {
          this.snackBar.open('Budget removed', 'Close', { duration: 2200 });
          this.loadBudgets();
        },
        error: () => {
          this.snackBar.open('Could not remove budget', 'Close', { duration: 3000 });
        }
      });
    });
  }

  getCategoryName(categoryId: number): string {
    return this.categories.find(c => c.categoryId === categoryId)?.name || `Category #${categoryId}`;
  }

  progressClass(progress: BudgetProgress | null): string {
    if (!progress) return 'safe';
    if (progress.alertStatus === 'EXCEEDED') return 'danger';
    if (progress.alertStatus === 'WARNING') return 'warning';
    return 'safe';
  }
}
