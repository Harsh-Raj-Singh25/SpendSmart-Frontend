import { Component, OnInit } from '@angular/core';
import { ModalService } from '../../services/modal.service';
import { ConfirmDialogConfig } from '../../services/modal.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: false,
  templateUrl: './confirm-dialog.html',
  styleUrls: ['./confirm-dialog.scss']
})
export class ConfirmDialogComponent implements OnInit {
  isOpen = false;
  config: ConfirmDialogConfig | null = null;

  constructor(private modalService: ModalService) {}

  ngOnInit(): void {
    this.modalService.modalState$.subscribe(state => {
      this.isOpen = state.isOpen;
      this.config = state.config;
    });
  }

  onConfirm(): void {
    this.modalService.confirmAction();
  }

  onCancel(): void {
    this.modalService.cancel();
  }

  getConfirmButtonClass(): string {
    if (!this.config) return 'btn-primary';
    switch (this.config.confirmClass) {
      case 'danger':
        return 'btn-delete';
      case 'warning':
        return 'btn-deactivate';
      default:
        return 'btn-primary';
    }
  }
}
