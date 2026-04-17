import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface Category {
  categoryId: number;
  userId: number;
  name: string;
  type: 'EXPENSE' | 'INCOME';
  icon: string;
  colorCode: string;
  budgetLimit: number | null;
  isDefault: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}/categories`;

  /**
   * Get all categories for a user.
   */
  getByUserId(userId: number): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.BASE}/user/${userId}`);
  }

  /**
   * Get categories filtered by type (EXPENSE or INCOME).
   */
  getByType(userId: number, type: 'EXPENSE' | 'INCOME'): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.BASE}/user/${userId}/type?type=${type}`);
  }

  /**
   * Get default system categories.
   */
  getDefaults(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.BASE}/defaults`);
  }

  /**
   * Initialize default categories for a new user.
   */
  initDefaults(userId: number): Observable<void> {
    return this.http.post<void>(`${this.BASE}/user/${userId}/initDefaults`, {});
  }

  /**
   * Get a single category by ID.
   */
  getById(categoryId: number): Observable<Category> {
    return this.http.get<Category>(`${this.BASE}/${categoryId}`);
  }
}
