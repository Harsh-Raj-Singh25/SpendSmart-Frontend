import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth';
import { CategoryService, Category } from '../../core/services/category.service';
import { RecurringService, RecurringTransaction, RecurringType, Frequency } from '../../core/services/recurring.service';

@Component({
  selector: 'app-recurring',
  standalone: false,
  templateUrl: './recurring.html',
  styleUrls: ['./recurring.scss']
})
export class RecurringComponent implements OnInit {
  recurringForm: FormGroup;
  userId: number | null = null;
  recurringList: RecurringTransaction[] = [];
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  loading = false;

  readonly frequencies: Frequency[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'];
  readonly types: RecurringType[] = ['EXPENSE', 'INCOME'];
  readonly paymentMethods = ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'WALLET'];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private categoryService: CategoryService,
    private recurringService: RecurringService,
    private snackBar: MatSnackBar
  ) {
    const today = new Date().toISOString().split('T')[0];
    this.recurringForm = this.fb.group({
      title: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      type: ['EXPENSE', Validators.required],
      categoryId: [null, Validators.required],
      frequency: ['MONTHLY', Validators.required],
      startDate: [today, Validators.required],
      endDate: [''],
      paymentMethod: ['UPI', Validators.required],
      description: ['']
    });
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user?.userId) return;
    this.userId = user.userId;

    this.loadCategories();
    this.loadRecurring();

    this.recurringForm.get('type')?.valueChanges.subscribe(type => {
      this.applyCategoryFilter(type as RecurringType);
    });
  }

  private loadCategories(): void {
    if (!this.userId) return;
    this.categoryService.getByUserId(this.userId).subscribe({
      next: categories => {
        this.categories = categories || [];
        this.applyCategoryFilter(this.recurringForm.get('type')?.value as RecurringType);
      },
      error: () => {
        this.categories = [];
        this.filteredCategories = [];
      }
    });
  }

  private applyCategoryFilter(type: RecurringType): void {
    this.filteredCategories = this.categories.filter(c => c.type === type);
    const selectedCategory = this.recurringForm.get('categoryId')?.value;
    if (!this.filteredCategories.some(c => c.categoryId === +selectedCategory)) {
      this.recurringForm.patchValue({ categoryId: this.filteredCategories[0]?.categoryId ?? null });
    }
  }

  loadRecurring(): void {
    if (!this.userId) return;
    this.loading = true;
    this.recurringService.getByUser(this.userId).subscribe({
      next: list => {
        this.recurringList = (list || []).sort((a, b) => (a.nextDueDate || '').localeCompare(b.nextDueDate || ''));
        this.loading = false;
      },
      error: () => {
        this.recurringList = [];
        this.loading = false;
      }
    });
  }

  createRecurring(): void {
    if (!this.userId || this.recurringForm.invalid) {
      this.recurringForm.markAllAsTouched();
      return;
    }

    const form = this.recurringForm.value;
    const payload: RecurringTransaction = {
      userId: this.userId,
      categoryId: Number(form.categoryId),
      title: form.title,
      amount: Number(form.amount),
      type: form.type,
      frequency: form.frequency,
      startDate: form.startDate,
      endDate: form.endDate || null,
      description: form.description || '',
      paymentMethod: form.paymentMethod,
      isActive: true
    };

    this.recurringService.create(payload).subscribe({
      next: () => {
        this.snackBar.open('Recurring transaction created', 'Close', { duration: 2500 });
        this.loadRecurring();
      },
      error: err => {
        this.snackBar.open(err.error?.message || 'Failed to create recurring rule', 'Close', { duration: 3000 });
      }
    });
  }

  deactivate(item: RecurringTransaction): void {
    if (!item.recurringId) return;
    this.recurringService.deactivate(item.recurringId).subscribe({
      next: () => {
        this.snackBar.open('Recurring rule deactivated', 'Close', { duration: 2500 });
        this.loadRecurring();
      },
      error: () => this.snackBar.open('Failed to deactivate recurring rule', 'Close', { duration: 3000 })
    });
  }

  remove(item: RecurringTransaction): void {
    if (!item.recurringId) return;
    const ok = window.confirm('Delete this recurring rule?');
    if (!ok) return;

    this.recurringService.delete(item.recurringId).subscribe({
      next: () => {
        this.snackBar.open('Recurring rule deleted', 'Close', { duration: 2500 });
        this.loadRecurring();
      },
      error: () => this.snackBar.open('Failed to delete recurring rule', 'Close', { duration: 3000 })
    });
  }

  getCategoryName(categoryId: number): string {
    return this.categories.find(c => c.categoryId === categoryId)?.name || `Category #${categoryId}`;
  }
}
