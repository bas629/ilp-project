import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  success(message: string) {
    this.snackBar.open(message, '✕', {
      duration: 3500,
      panelClass: ['notif-success'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  error(message: string) {
    this.snackBar.open(message, '✕', {
      duration: 4000,
      panelClass: ['notif-error'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  warning(message: string) {
    this.snackBar.open(message, '✕', {
      duration: 3500,
      panelClass: ['notif-warning'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  info(message: string) {
    this.snackBar.open(message, '✕', {
      duration: 3000,
      panelClass: ['notif-info'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }
}
