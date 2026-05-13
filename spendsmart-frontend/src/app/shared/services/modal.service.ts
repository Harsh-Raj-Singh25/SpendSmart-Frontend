import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ConfirmDialogConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmClass?: 'danger' | 'primary' | 'warning';
}

export interface ModalState {
  isOpen: boolean;
  config: ConfirmDialogConfig | null;
  resolve?: (value: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalState = new BehaviorSubject<ModalState>({
    isOpen: false,
    config: null
  });

  public modalState$: Observable<ModalState> = this.modalState.asObservable();

  confirm(config: ConfirmDialogConfig): Promise<boolean> {
    return new Promise(resolve => {
      this.modalState.next({
        isOpen: true,
        config,
        resolve
      });
    });
  }

  closeModal(confirmed: boolean): void {
    const state = this.modalState.value;
    if (state.resolve) {
      state.resolve(confirmed);
    }
    this.modalState.next({
      isOpen: false,
      config: null
    });
  }

  cancel(): void {
    this.closeModal(false);
  }

  confirmAction(): void {
    this.closeModal(true);
  }
}
