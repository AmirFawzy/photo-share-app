import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  loadingState = new BehaviorSubject<boolean>(false);
  dialogLoadingState = new BehaviorSubject<boolean>(false);

  constructor(private snackbar: MatSnackBar) { }

  respondMessage(message: string, duration: number = 5000) {

    this.snackbar.open(message, 'X', {
      duration: duration,
      horizontalPosition: 'left',
      panelClass: 'photo-share-snackbar'
    });

  }
}
