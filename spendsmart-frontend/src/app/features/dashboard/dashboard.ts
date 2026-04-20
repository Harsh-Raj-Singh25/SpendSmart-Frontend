import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { TransactionService, Transaction } from '../../core/services/transaction.service';
import { AuthService } from '../../core/services/auth';
import { CategoryService, Category } from '../../core/services/category.service';
import { BudgetService, Budget, BudgetProgress } from '../../core/services/budget.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { NotificationService } from '../../core/services/notification.service';
import { RecurringService, RecurringTransaction } from '../../core/services/recurring.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, of, catchError } from 'rxjs';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('pieChart') pieChartRef!: ElementRef;
  @ViewChild('barChart') barChartRef!: ElementRef;
  
  private pieChartInstance: Chart | null = null;
  private barChartInstance: Chart | null = null;

  incomeTransactions: Transaction[] = [];
  expenseTransactions: Transaction[] = [];
  
  income = 0;
  expense = 0;
  balance = 0;
  trend = 0;

  activeTab: 'EXPENSE' | 'INCOME' | 'ANALYTICS' = 'EXPENSE';
  
  categories: Category[] = [];
  expenseCategories: Category[] = [];
  incomeCategories: Category[] = [];
  
  budgets: Budget[] = [];
  budgetProgressList: BudgetProgress[] = [];
  upcomingRecurring: RecurringTransaction[] = [];
  healthScore: number | null = null;
  spendingForecast: number | null = null;
  cashflow: { inflow: number; outflow: number; net: number } = { inflow: 0, outflow: 0, net: 0 };
  topCategories: Array<{ name: string; amount: number }> = [];

  quickAmount = 0;
  quickDescription = '';
  quickType: 'INCOME' | 'EXPENSE' = 'EXPENSE';
  quickCategoryId: number | null = null;

  // New Budget Form
  showBudgetForm = false;
  newBudgetCategoryId: number | null = null;
  newBudgetLimit = 0;

  isPremium = false;
  private userId: number | null = null;
  dailyTransactionCount = 0;
  readonly FREE_DAILY_LIMIT = 7;

  constructor(
    public transactionService: TransactionService,
    private authService: AuthService,
    private categoryService: CategoryService,
    private budgetService: BudgetService,
    private analyticsService: AnalyticsService,
    private notificationService: NotificationService,
    private recurringService: RecurringService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userId = user.userId;
      this.isPremium = user.subscriptionType === 'PREMIUM';
      this.loadAllData();
    }
  }
  
  ngAfterViewInit() {
    // delay somewhat to allow dom to render
    setTimeout(() => {
      if (this.userId) {
        this.renderCharts();
      }
    }, 500);
  }

  loadAllData() {
    if (!this.userId) return;
    
    this.loadCategories();
    this.loadTransactions();
    this.loadBudgets();
    this.loadUpcomingRecurring();
    this.loadAdvancedAnalytics();
  }

  loadAdvancedAnalytics() {
    if (!this.userId) return;

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    this.analyticsService.getHealthScore(this.userId)
      .pipe(catchError(() => of(null)))
      .subscribe(score => {
        this.healthScore = score;
      });

    this.analyticsService.getSpendingForecast(this.userId)
      .pipe(catchError(() => of(null)))
      .subscribe(forecast => {
        this.spendingForecast = forecast;
      });

    this.analyticsService.getCashflow(this.userId, month)
      .pipe(catchError(() => of({} as Record<string, number>)))
      .subscribe((data: any) => {
        this.cashflow = {
          inflow: Number(data?.inflow ?? data?.income ?? 0),
          outflow: Number(data?.outflow ?? data?.expense ?? 0),
          net: Number(data?.net ?? 0)
        };
      });

    this.analyticsService.getTopCategories(this.userId, month)
      .pipe(catchError(() => of([])))
      .subscribe((items: any[]) => {
        this.topCategories = (items || []).slice(0, 5).map((entry: any) => {
          if (entry?.key !== undefined && entry?.value !== undefined) {
            return { name: String(entry.key), amount: Number(entry.value) };
          }
          if (Array.isArray(entry) && entry.length >= 2) {
            return { name: String(entry[0]), amount: Number(entry[1]) };
          }
          return { name: 'Category', amount: Number(entry?.amount || 0) };
        });
      });
  }

  loadUpcomingRecurring() {
    if (!this.userId) return;
    this.recurringService.getUpcoming(this.userId)
      .pipe(catchError(() => of([])))
      .subscribe(list => {
        this.upcomingRecurring = (list || []).slice(0, 5);
      });
  }

  getUpcomingCategoryName(categoryId: number): string {
    return this.getCategoryName(categoryId);
  }

  loadCategories() {
    if (!this.userId) return;
    this.categoryService.getByUserId(this.userId).subscribe({
      next: (cats) => {
        if (!cats || cats.length === 0) {
          // Initialize defaults
          this.categoryService.initDefaults(this.userId!).subscribe({
            next: () => this.loadCategories() // recursive call once after init
          });
        } else {
          this.categories = cats;
          this.expenseCategories = cats.filter(c => c.type === 'EXPENSE');
          this.incomeCategories = cats.filter(c => c.type === 'INCOME');
          if (!this.quickCategoryId && this.expenseCategories.length > 0) {
            this.quickCategoryId = this.expenseCategories[0].categoryId;
          }
        }
      },
      error: () => {
        this.categories = [];
        this.expenseCategories = [];
        this.incomeCategories = [];
      }
    });
  }

  loadBudgets() {
    if (!this.userId) return;
    this.budgetService.getActiveBudgets(this.userId).subscribe({
      next: (budgets) => {
        this.budgets = budgets;
        this.budgetProgressList = [];
        
        budgets.forEach(b => {
          if (b.budgetId) {
            this.budgetService.getProgress(b.budgetId).subscribe({
              next: (progress) => {
                this.budgetProgressList.push(progress);
                this.checkBudgetAlert(b, progress);
              },
              error: () => {
                // Skip failed progress calls for individual budgets to keep dashboard usable.
              }
            });
          }
        });
      },
      error: () => {
        this.budgets = [];
        this.budgetProgressList = [];
      }
    });
  }
  
  checkBudgetAlert(budget: Budget, progress: BudgetProgress) {
    if (!this.userId) return;
    // Notify user if spending > 85% threshold
    if (progress.percentageUsed >= 85) {
      const remaining = progress.limitAmount - progress.spentAmount;
      const title = `Budget Alert: ${budget.name}`;
      const amount = remaining < 0 ? Math.abs(remaining) : 0; 
      
      this.notificationService.sendBudgetAlert(this.userId, title, amount).subscribe();
      
      if (progress.percentageUsed >= 100) {
        this.snackBar.open(`WARNING: You have exceeded your ${budget.name} budget!`, 'Close', { duration: 5000, panelClass: ['snack-error'] });
      } else {
        this.snackBar.open(`Heads up: You used ${progress.percentageUsed}% of ${budget.name} budget.`, 'Close', { duration: 4000, panelClass: ['snack-warning'] });
      }
    }
  }

  loadTransactions() {
    if (!this.userId) return;

    forkJoin([
      this.transactionService.getExpensesByUser(this.userId).pipe(catchError(() => of([]))),
      this.transactionService.getIncomesByUser(this.userId).pipe(catchError(() => of([])))
    ]).subscribe({
      next: ([expenses, incomes]) => {
        this.expenseTransactions = (expenses || []).map((e: any) => ({
          id: Number(e.expenseId),
          backendId: Number(e.expenseId),
          amount: Number(e.amount || 0),
          category: this.getCategoryName(e.categoryId),
          description: e.title || e.notes || 'Expense',
          date: e.date,
          type: 'EXPENSE' as 'EXPENSE'
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        this.incomeTransactions = (incomes || []).map((i: any) => ({
          id: Number(i.incomeId),
          backendId: Number(i.incomeId),
          amount: Number(i.amount || 0),
          category: this.getCategoryName(i.categoryId),
          description: i.title || i.notes || 'Income',
          date: i.date,
          type: 'INCOME' as 'INCOME'
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        this.calculateSummary();
        this.updateDailyCount();
        this.renderCharts();
      },
      error: () => {
        this.expenseTransactions = [];
        this.incomeTransactions = [];
        this.calculateSummary();
      }
    });
  }
  
  getCategoryName(catId: number): string {
    const cat = this.categories.find(c => c.categoryId === catId);
    return cat ? cat.name : `Category #${catId || '-'}`;
  }

  calculateSummary() {
    this.income = this.incomeTransactions.reduce((acc, t) => acc + t.amount, 0);
    this.expense = this.expenseTransactions.reduce((acc, t) => acc + t.amount, 0);
    this.balance = this.income - this.expense;

    if (this.expense === 0) {
      this.trend = 100;
      return;
    }
    this.trend = Number((((this.income - this.expense) / this.expense) * 100).toFixed(1));
  }

  private updateDailyCount() {
    const today = new Date().toISOString().split('T')[0];
    const todayExp = this.expenseTransactions.filter(tx => String(tx.date).startsWith(today)).length;
    const todayInc = this.incomeTransactions.filter(tx => String(tx.date).startsWith(today)).length;
    this.dailyTransactionCount = todayExp + todayInc;
  }
  
  onQuickTypeChange(type: 'INCOME' | 'EXPENSE') {
    this.quickType = type;
    const list = type === 'EXPENSE' ? this.expenseCategories : this.incomeCategories;
    this.quickCategoryId = list.length > 0 ? list[0].categoryId : null;
  }

  addQuickTransaction() {
    if (!this.userId || this.quickAmount <= 0 || !this.quickDescription.trim() || !this.quickCategoryId) {
      return;
    }
    
    // ENFORCE FREE TIER LIMIT (7 combined transactions per day)
    if (!this.isPremium && this.dailyTransactionCount >= this.FREE_DAILY_LIMIT) {
      this.snackBar.open('Daily free limit reached (7 transactions). Upgrade to Premium for unlimited.', 'Close', { duration: 5000 });
      return;
    }

    const payloadBase = {
      userId: this.userId,
      categoryId: this.quickCategoryId,
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
        }).pipe(
          catchError(err => {
            this.snackBar.open(err.error?.message || 'Error adding expense', 'Close', { duration: 3000 });
            return of(null);
          })
        )
      : this.transactionService.addIncome({
          ...payloadBase,
          source: 'OTHER',
          recurrencePeriod: null
        }).pipe(
          catchError(err => {
            this.snackBar.open(err.error?.message || 'Error adding income', 'Close', { duration: 3000 });
            return of(null);
          })
        );

    request$.subscribe(res => {
      if (res) {
        this.quickAmount = 0;
        this.quickDescription = '';
        this.snackBar.open('Transaction added', 'Close', { duration: 2000 });
        this.loadTransactions();
        this.loadBudgets(); // Refresh budget progress
      }
    });
  }

  removeTransaction(tx: Transaction) {
    const confirmed = window.confirm('Delete this transaction?');
    if (!confirmed || !tx.backendId) return;

    const request$ = tx.type === 'EXPENSE'
      ? this.transactionService.deleteExpense(tx.backendId)
      : this.transactionService.deleteIncome(tx.backendId);

    request$.subscribe({
      next: () => {
        this.loadTransactions();
        this.loadBudgets(); // Refresh budget progress
      }
    });
  }
  
  // Budget Management
  createBudget() {
    if (!this.userId || !this.newBudgetCategoryId || this.newBudgetLimit <= 0) return;
    
    const cat = this.categories.find(c => c.categoryId == this.newBudgetCategoryId);
    if (!cat) return;
    
    const budget: Budget = {
      userId: this.userId,
      categoryId: this.newBudgetCategoryId,
      name: `${cat.name} Budget`,
      limitAmount: this.newBudgetLimit,
      currency: 'INR',
      period: 'MONTHLY',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
      alertThreshold: 85,
      isActive: true,
      spentAmount: 0
    };
    
    this.budgetService.createBudget(budget).subscribe({
      next: () => {
        this.snackBar.open('Budget created successfully', 'Close', { duration: 3000 });
        this.showBudgetForm = false;
        this.newBudgetLimit = 0;
        this.loadBudgets();
      },
      error: err => {
        this.snackBar.open(err.error?.message || 'Could not create budget', 'Close', { duration: 3000 });
      }
    });
  }
  
  deleteBudget(budgetId: number) {
    if (confirm('Delete this budget?')) {
      this.budgetService.deleteBudget(budgetId).subscribe(() => this.loadBudgets());
    }
  }

  // Analytics Charts
  renderCharts() {
    if (!this.userId) return;
    const now = new Date();
    
    // Category Breakdown (Pie)
    this.analyticsService.getCategoryBreakdown(this.userId, now.getFullYear(), now.getMonth() + 1)
      .pipe(catchError(() => of({})))
      .subscribe(data => {
        if (this.pieChartInstance) this.pieChartInstance.destroy();
        
        const labels = Object.keys(data).map(id => this.getCategoryName(+id));
        const values = Object.values(data);
        
        if (this.pieChartRef?.nativeElement) {
          this.pieChartInstance = new Chart(this.pieChartRef.nativeElement, {
            type: 'pie',
            data: {
              labels: labels.length ? labels : ['No Data'],
              datasets: [{
                data: values.length ? values : [1],
                backgroundColor: ['#4f46e5', '#34d399', '#f59e0b', '#ef4444', '#8b5cf6', '#eab308'],
                borderWidth: 0
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'right', labels: { color: '#cbd5e1' } }
              }
            }
          });
        }
      });
    
    // Income vs Expense Trend (Bar)
    this.analyticsService.getIncomeVsExpenseTrend(this.userId, now.getFullYear())
      .pipe(catchError(() => of([])))
      .subscribe(data => {
        if (this.barChartInstance) this.barChartInstance.destroy();
        
        // If backend returns month labels, use them; otherwise fallback labels keep chart stable.
        const chartLabels = data?.length ? data.map(d => `Month ${d.month || '?'}`) : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const incomeData = data?.length ? data.map(d => d.income) : [0,0,0,0,0,0];
        const expenseData = data?.length ? data.map(d => d.expense) : [0,0,0,0,0,0];

        if (this.barChartRef?.nativeElement) {
          this.barChartInstance = new Chart(this.barChartRef.nativeElement, {
            type: 'bar',
            data: {
              labels: chartLabels,
              datasets: [
                {
                  label: 'Income',
                  data: incomeData,
                  backgroundColor: '#34d399',
                  borderRadius: 4
                },
                {
                  label: 'Expense',
                  data: expenseData,
                  backgroundColor: '#ef4444',
                  borderRadius: 4
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                y: { ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(255,255,255,0.1)' } }
              },
              plugins: {
                legend: { labels: { color: '#cbd5e1' } }
              }
            }
          });
        }
      });
  }
  
  getBudgetCategoryName(budgetId: number): string {
    const b = this.budgets.find(x => x.budgetId === budgetId);
    return b ? this.getCategoryName(b.categoryId) : 'Unknown Category';
  }
}
