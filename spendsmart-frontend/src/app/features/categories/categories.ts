import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { CategoryService, Category } from '../../core/services/category.service';
import { AuthService } from '../../core/services/auth';
import { ModalService } from '../../shared/services/modal.service';

const PRESET_ICONS = ['🍔', '🚗', '💡', '💊', '💰', '📈', '🛒', '🎬', '📚', '⚽', '✈️', '🏠', '🎓', '👨‍💼', '🎁', '🍷'];
const PRESET_COLORS = ['#FF5733', '#33A1FF', '#FFC300', '#E333FF', '#28A745', '#17A2B8', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181'];

@Component({
  selector: 'app-categories',
  standalone: false,
  templateUrl: './categories.html',
  styleUrl: './categories.scss'
})
export class CategoriesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private modalService = inject(ModalService);
  private router = inject(Router);

  categoryForm!: FormGroup;
  categories: Category[] = [];
  userId!: number;
  loading = false;
  showColorPicker = false;
  showIconPicker = false;
  selectedIconIndex = 0;
  presetIcons = PRESET_ICONS;
  presetColors = PRESET_COLORS;

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user?.userId) {
      this.snackBar.open('Session expired. Please login again.', 'Close', { duration: 3000 });
      this.router.navigate(['/login']);
      return;
    }
    this.userId = user.userId;
    this.initializeForm();
    this.loadCategoriesAndThenRefresh();
  }

  private initializeForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      type: ['EXPENSE', Validators.required],
      icon: ['🛒', Validators.required],
      colorCode: ['#FF5733', Validators.required]
    });
  }

  private loadCategoriesAndThenRefresh(): void {
    this.categoryService.getByUserId(this.userId).subscribe(
      (allCategories) => {
        // Filter out default categories (isDefault = true), show only custom ones
        this.categories = allCategories.filter(c => !c.isDefault);
      },
      (error) => {
        console.error('Error loading categories:', error);
        this.snackBar.open('Failed to load categories', 'Close', { duration: 3000 });
      }
    );
  }

  selectIcon(icon: string, index: number): void {
    this.categoryForm.patchValue({ icon });
    this.selectedIconIndex = index;
    this.showIconPicker = false;
  }

  selectColor(color: string): void {
    this.categoryForm.patchValue({ colorCode: color });
    this.showColorPicker = false;
  }

  createCategory(): void {
    if (!this.categoryForm.valid) {
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.loading = true;
    const newCategory = {
      ...this.categoryForm.value,
      userId: this.userId
    };

    this.categoryService.createCategory(newCategory).subscribe(
      (created) => {
        this.snackBar.open('Category created successfully', 'Close', { duration: 2000 });
        this.categoryForm.reset({
          name: '',
          type: 'EXPENSE',
          icon: '🛒',
          colorCode: '#FF5733'
        });
        this.selectedIconIndex = 0;
        this.loadCategoriesAndThenRefresh();
        this.loading = false;
      },
      (error) => {
        this.loading = false;
        const errorMsg = error.error?.message || error.statusText || 'Failed to create category';
        this.snackBar.open(errorMsg, 'Close', { duration: 3000 });
      }
    );
  }

  editCategory(category: Category): void {
    this.categoryForm.patchValue({
      name: category.name,
      type: category.type,
      icon: category.icon,
      colorCode: category.colorCode
    });
    this.selectedIconIndex = PRESET_ICONS.indexOf(category.icon) >= 0 ? PRESET_ICONS.indexOf(category.icon) : 0;
    window.scrollTo(0, 0);
  }

  deleteCategory(category: Category): void {
    this.modalService.confirm({
      title: 'Delete Category',
      message: `Are you sure you want to delete "${category.name}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmClass: 'danger'
    }).then((confirmed) => {
      if (confirmed) {
        this.categoryService.deleteCategory(category.categoryId).subscribe(
          () => {
            this.snackBar.open('Category deleted successfully', 'Close', { duration: 2000 });
            this.loadCategoriesAndThenRefresh();
          },
          (error) => {
            const errorMsg = error.error?.message || 'Failed to delete category';
            this.snackBar.open(errorMsg, 'Close', { duration: 3000 });
          }
        );
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  resetForm(): void {
    this.categoryForm.reset({
      name: '',
      type: 'EXPENSE',
      icon: '🛒',
      colorCode: '#FF5733'
    });
    this.selectedIconIndex = 0;
  }
}
