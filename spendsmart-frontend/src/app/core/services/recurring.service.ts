import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type RecurringType = 'EXPENSE' | 'INCOME';
export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface RecurringTransaction {
  recurringId?: number;
  userId: number;
  categoryId: number;
  title: string;
  amount: number;
  type: RecurringType;
  frequency: Frequency;
  startDate: string;
  endDate?: string | null;
  nextDueDate?: string;
  isActive?: boolean;
  description?: string;
  paymentMethod: string;
}

@Injectable({
  providedIn: 'root'
})
export class RecurringService {
  private http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}/recurring`;

  getByUser(userId: number): Observable<RecurringTransaction[]> {
    return this.http.get<RecurringTransaction[]>(`${this.BASE}/user/${userId}`);
  }

  getActive(userId: number): Observable<RecurringTransaction[]> {
    return this.http.get<RecurringTransaction[]>(`${this.BASE}/user/${userId}/active`);
  }

  getUpcoming(userId: number): Observable<RecurringTransaction[]> {
    return this.http.get<RecurringTransaction[]>(`${this.BASE}/user/${userId}/upcoming`);
  }

  create(payload: RecurringTransaction): Observable<RecurringTransaction> {
    return this.http.post<RecurringTransaction>(this.BASE, payload);
  }

  update(recurringId: number, payload: RecurringTransaction): Observable<RecurringTransaction> {
    return this.http.put<RecurringTransaction>(`${this.BASE}/${recurringId}`, payload);
  }

  deactivate(recurringId: number): Observable<void> {
    return this.http.patch<void>(`${this.BASE}/${recurringId}/deactivate`, {});
  }

  delete(recurringId: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${recurringId}`);
  }
}
