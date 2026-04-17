import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}/analytics`;

  /**
   * Get expense breakdown by category for a specific month.
   * Returns { "categoryId": amount } map.
   */
  getCategoryBreakdown(userId: number, year: number, month: number): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(
      `${this.BASE}/user/${userId}/breakdown/category?year=${year}&month=${month}`
    );
  }

  /**
   * Get income vs expense trend for a full year.
   * Returns array of { month, income, expense } objects.
   */
  getIncomeVsExpenseTrend(userId: number, year: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.BASE}/user/${userId}/trend/income-expense?year=${year}`
    );
  }

  /**
   * Get financial health score (0-100).
   */
  getHealthScore(userId: number): Observable<number> {
    return this.http.get<number>(`${this.BASE}/user/${userId}/health`);
  }

  /**
   * Get spending forecast.
   */
  getSpendingForecast(userId: number): Observable<number> {
    return this.http.get<number>(`${this.BASE}/user/${userId}/forecast`);
  }

  /**
   * Get category pie chart data.
   */
  getCategoryPieChart(userId: number, month: number, year: number): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(
      `${this.BASE}/charts/category-pie?userId=${userId}&month=${month}&year=${year}`
    );
  }

  /**
   * Get 6-month cashflow data for bar chart.
   */
  getCashflowChart(userId: number, month: number, year: number): Observable<any> {
    return this.http.get<any>(
      `${this.BASE}/charts/cashflow?userId=${userId}&month=${month}&year=${year}`
    );
  }
}
