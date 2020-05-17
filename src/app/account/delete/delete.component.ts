import { Component, OnInit } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';

import { ConfirmDeleteAccountDialogComponent } from './confirm-delete-account-dialog/confirm-delete-account-dialog.component';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'ps-delete',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss']
})
export class DeleteComponent implements OnInit {

  constructor(
    public dialog: MatDialog,
    private userService: UserService,
    private breakpointService: BreakpointObserver
  ) { }

  ngOnInit() {
  }

  private breakpointIsMatched(breakpoint: string, prefix = 'max'): boolean {
    return this.breakpointService.isMatched(`(${prefix}-width: ${breakpoint})`);
  }

  onDelete() {

    const dialogRef = this.dialog.open(ConfirmDeleteAccountDialogComponent, {
      backdropClass: 'backdrop',
      closeOnNavigation: true,
      autoFocus: false
    });

    if (this.breakpointIsMatched('480px')) {
      dialogRef.updateSize('76vw');
    } else if (this.breakpointIsMatched('768px')) {
      dialogRef.updateSize('66vw');
    } else if (this.breakpointIsMatched('992px')) {
      dialogRef.updateSize('56vw');
    } else if (this.breakpointIsMatched('1200px')) {
      dialogRef.updateSize('46vw');
    } else if (this.breakpointIsMatched('1201px', 'min')) {
      dialogRef.updateSize('560px');
    }

    dialogRef.afterClosed().subscribe(result => {

      if (result) {
        this.userService.deleteAccount();
      }

    });

  }
}
