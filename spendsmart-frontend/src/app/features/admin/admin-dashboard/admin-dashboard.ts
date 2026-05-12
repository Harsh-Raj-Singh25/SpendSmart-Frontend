import { Component, OnInit } from '@angular/core';
import { AdminService, AdminBudget, AdminExpense, AdminIncome, AdminUserCount } from '../../../core/services/admin.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface AdminKpi {
  label: string;
  value: number | string;
  helper?: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.scss']
})
export class AdminDashboardComponent implements OnInit {
  loading = true;
  kpis: AdminKpi[] = [];
  expenses: AdminExpense[] = [];
  incomes: AdminIncome[] = [];
  budgets: AdminBudget[] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadOverview();
  }

  private loadOverview() {
    this.loading = true;

    forkJoin({
      userCount: this.adminService.getUserCount().pipe(catchError(() => of(null as AdminUserCount | null))),
      expenses: this.adminService.getAdminExpenses().pipe(catchError(() => of([] as AdminExpense[]))),
      incomes: this.adminService.getAdminIncomes().pipe(catchError(() => of([] as AdminIncome[]))),
      budgets: this.adminService.getAdminBudgets().pipe(catchError(() => of([] as AdminBudget[])))
    }).subscribe(({ userCount, expenses, incomes, budgets }) => {
      this.expenses = expenses || [];
      this.incomes = incomes || [];
      this.budgets = budgets || [];

      const totalExpenseAmount = this.expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const totalIncomeAmount = this.incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const activeBudgets = this.budgets.filter(b => b.isActive).length;

      this.kpis = [
        { label: 'Total Users', value: userCount?.total ?? '--' },
        { label: 'Active Users', value: userCount?.active ?? '--' },
        { label: 'Expenses (Count)', value: this.expenses.length, helper: `Total: ${totalExpenseAmount.toFixed(2)}` },
        { label: 'Incomes (Count)', value: this.incomes.length, helper: `Total: ${totalIncomeAmount.toFixed(2)}` },
        { label: 'Budgets Active', value: activeBudgets, helper: `${this.budgets.length} total` }
      ];

      this.loading = false;
    });
  }
}
