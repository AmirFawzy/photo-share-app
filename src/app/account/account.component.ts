import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import { UploadUserPhotoDialogComponent } from './upload-user-photo-dialog/upload-user-photo-dialog.component';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';

interface AccountNav {
  route: string;
  text: string;
}

@Component({
  selector: 'ps-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AccountComponent implements OnInit, OnDestroy {
  navList: AccountNav[] = [{
    route: '/account/settings',
    text: 'Settings'
  },
  {
    route: '/account/followers',
    text: 'Followers'
  },
  {
    route: '/account/notifications',
    text: 'Notifications'
  },
  {
    route: '/account/newsletter',
    text: 'Newsletter'
  },
  {
    route: '/account/delete-account',
    text: 'Delete'
  }];
  userSettings: User;
  userSettingsSupscription: Subscription;

  constructor(
    private router: Router,
    public dialog: MatDialog,
    private userService: UserService,
    private breakpointService: BreakpointObserver
  ) {
    if (this.router.url === '/account') {
      this.router.navigate(['/account/settings']);
    }
  }

  ngOnInit() {
    this.userService.getUserAccountSettings(false);

    this.userSettingsSupscription = this.userService.accountSettings$.subscribe(
      (accountSettings: User) => this.userSettings = accountSettings
    );

  }

  changePhoto(): void {

    const dialogRef = this.dialog.open(UploadUserPhotoDialogComponent, {
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

  }

  private breakpointIsMatched(breakpoint: string, prefix = 'max'): boolean {
    return this.breakpointService.isMatched(`(${prefix}-width: ${breakpoint})`);
  }

  ngOnDestroy() {
    this.userSettingsSupscription.unsubscribe();
    this.userService.cancelSubscription();
  }
}
