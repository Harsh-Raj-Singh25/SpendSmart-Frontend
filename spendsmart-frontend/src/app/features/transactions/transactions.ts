import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth';
import { Category, CategoryService } from '../../core/services/category.service';
import { Transaction, TransactionService } from '../../core/services/transaction.service';
import { ModalService } from '../../shared/services/modal.service';

@Component({
  selector: 'app-transactions',
  standalone: false,
  templateUrl: './transactions.html',
  styleUrls: ['./transactions.scss']
})
export class TransactionsComponent implements OnInit {
  form: FormGroup;

  userId: number | null = null;
  categories: Category[] = [];
  filteredCategories: Category[] = [];

  incomeTransactions: Transaction[] = [];
  expenseTransactions: Transaction[] = [];

  activeTab: 'EXPENSE' | 'INCOME' = 'EXPENSE';
  loading = false;
  submitting = false;

  readonly paymentMethods = ['UPI', 'CARD', 'CASH', 'BANK_TRANSFER', 'WALLET'];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private categoryService: CategoryService,
    private transactionService: TransactionService,
    private snackBar: MatSnackBar,
    private modalService: ModalService
  ) {
    const today = new Date().toISOString().split('T')[0];

    this.form = this.fb.group({
      type: ['EXPENSE', Validators.required],
      categoryId: [null, Validators.required],
      title: ['General expense'],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      isRecurring: [false],
      paymentMethod: ['UPI', Validators.required],
      date: [today, Validators.required]
    });
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user?.userId) {
      this.snackBar.open('Session expired. Please login again.', 'Close', { duration: 3000 });
      return;
    }

    this.userId = user.userId;
    // Load categories first, THEN load transactions so category names are available
    this.loadCategoriesAndThenTransactions();

    this.form.get('type')?.valueChanges.subscribe((type: 'EXPENSE' | 'INCOME') => {
      this.applyCategoryFilter(type);
      this.form.patchValue({
        title: type === 'EXPENSE' ? 'General expense' : 'General income',
        paymentMethod: 'UPI'
      });
      this.activeTab = type;
    });
  }

  private loadCategories(): void {
    if (!this.userId) return;

    this.categoryService.getByUserId(this.userId).subscribe({
      next: (cats) => {
        if (!cats || cats.length === 0) {
          this.categoryService.initDefaults(this.userId!).subscribe({
            next: () => this.loadCategories(),
            error: () => {
              this.categories = [];
              this.filteredCategories = [];
            }
          });
          return;
        }

        this.categories = cats;
        this.applyCategoryFilter(this.form.get('type')?.value as 'EXPENSE' | 'INCOME');
      },
      error: () => {
        this.categories = [];
        this.filteredCategories = [];
      }
    });
  }

  private loadCategoriesAndThenTransactions(): void {
    if (!this.userId) return;

    this.categoryService.getByUserId(this.userId).subscribe({
      next: (cats) => {
        if (!cats || cats.length === 0) {
          this.categoryService.initDefaults(this.userId!).subscribe({
            next: () => this.loadCategoriesAndThenTransactions(),
            error: () => {
              this.categories = [];
              this.filteredCategories = [];
              this.loadTransactions();
            }
          });
          return;
        }

        this.categories = cats;
        this.applyCategoryFilter(this.form.get('type')?.value as 'EXPENSE' | 'INCOME');
        // Now load transactions after categories are ready
        this.loadTransactions();
      },
      error: () => {
        this.categories = [];
        this.filteredCategories = [];
        this.loadTransactions();
      }
    });
  }

  private applyCategoryFilter(type: 'EXPENSE' | 'INCOME'): void {
    this.filteredCategories = this.categories.filter((c) => c.type === type);

    const selectedCategory = Number(this.form.get('categoryId')?.value);
    const validSelection = this.filteredCategories.some((c) => c.categoryId === selectedCategory);

    if (!validSelection) {
      this.form.patchValue({ categoryId: this.filteredCategories[0]?.categoryId ?? null });
    }
  }

  loadTransactions(): void {
    if (!this.userId) return;

    this.loading = true;

    forkJoin([
      this.transactionService.getExpensesByUser(this.userId).pipe(catchError(() => of([]))),
      this.transactionService.getIncomesByUser(this.userId).pipe(catchError(() => of([])))
    ]).subscribe({
      next: ([expenses, incomes]) => {
        this.expenseTransactions = (expenses || []).map((e: any) => ({
          id: Number(e.expenseId),
          backendId: Number(e.expenseId),
          categoryId: Number(e.categoryId),
          amount: Number(e.amount || 0),
          category: this.getCategoryName(Number(e.categoryId)),
          description: e.title || 'Expense',
          date: e.date,
          type: 'EXPENSE' as 'EXPENSE'
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        this.incomeTransactions = (incomes || []).map((i: any) => ({
          id: Number(i.incomeId),
          backendId: Number(i.incomeId),
          categoryId: Number(i.categoryId),
          amount: Number(i.amount || 0),
          category: this.getCategoryName(Number(i.categoryId)),
          description: i.title || 'Income',
          date: i.date,
          type: 'INCOME' as 'INCOME'
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        this.loading = false;
      },
      error: () => {
        this.expenseTransactions = [];
        this.incomeTransactions = [];
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
    const txType = raw.type as 'EXPENSE' | 'INCOME';

    const payloadBase = {
      userId: this.userId,
      categoryId: Number(raw.categoryId),
      title: (raw.title || (txType === 'EXPENSE' ? 'General expense' : 'General income')).trim(),
      amount: Number(raw.amount),
      paymentMethod: raw.paymentMethod || 'UPI',
      date: raw.date,
      type: txType
    };

    this.submitting = true;

    const request$ = txType === 'EXPENSE'
      ? this.transactionService.addExpense({
          ...payloadBase,
          currency: 'INR',
          notes: payloadBase.title,
          isRecurring: !!raw.isRecurring
        })
      : this.transactionService.addIncome({
          ...payloadBase,
          source: 'OTHER',
          isRecurring: !!raw.isRecurring,
          recurrencePeriod: raw.isRecurring ? 'MONTHLY' : null
        });

    request$.subscribe({
      next: () => {
        this.submitting = false;
        this.snackBar.open('Transaction added', 'Close', { duration: 2500 });
        this.loadTransactions();

        this.form.patchValue({
          title: txType === 'EXPENSE' ? 'General expense' : 'General income',
          amount: 0,
          paymentMethod: 'UPI',
          date: new Date().toISOString().split('T')[0]
        });
      },
      error: (err) => {
        this.submitting = false;
        this.snackBar.open(err.error?.message || 'Could not add transaction', 'Close', { duration: 3000 });
      }
    });
  }

  removeTransaction(tx: Transaction): void {
    if (!tx.backendId) return;

    const transactionType = tx.type === 'EXPENSE' ? 'Expense' : 'Income';
    this.modalService.confirm({
      title: `Delete ${transactionType}`,
      message: `Are you sure you want to delete this ${transactionType.toLowerCase()}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmClass: 'danger'
    }).then(confirmed => {
      if (!confirmed) return;

      const request$ = tx.type === 'EXPENSE'
        ? this.transactionService.deleteExpense(tx.backendId!)
        : this.transactionService.deleteIncome(tx.backendId!);

      request$.subscribe({
        next: () => {
          this.snackBar.open('Transaction removed', 'Close', { duration: 2200 });
          this.loadTransactions();
        },
        error: () => {
          this.snackBar.open('Could not remove transaction', 'Close', { duration: 3000 });
        }
      });
    });
  }

  setTab(tab: 'EXPENSE' | 'INCOME'): void {
    this.activeTab = tab;
  }

  private getCategoryName(categoryId: number): string {
    return this.categories.find((c) => c.categoryId === categoryId)?.name || `Category #${categoryId}`;
  }

  getCategoryIcon(categoryId: number, type: 'EXPENSE' | 'INCOME'): string {
    const category = this.categories.find((c) => c.categoryId === categoryId);
    if (category?.icon) {
      return category.icon;
    }

    const categoryName = this.getCategoryName(categoryId);
    return categoryName !== `Category #${categoryId}` ? categoryName.charAt(0).toUpperCase() : (type === 'EXPENSE' ? 'E' : 'I');
  }
}
