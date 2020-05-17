import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subscription, EMPTY } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

import { HireMeDialogComponent } from './hire-me-dialog/hire-me-dialog.component';
import { GeneralData } from '../models/user.model';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { LoginComponent } from '../shared/login/login.component';
import { TrendsService } from '../services/trends.service';
import { UiService } from '../services/ui.service';

@Component({
  selector: 'ps-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class UserProfileComponent implements OnInit, OnDestroy {
  user: GeneralData;
  followingBtnText = 'Following';
  followingBtnColor = 'accent';
  followBtnHidden = false;
  isAuth: boolean;
  isProfileOwner = false;
  tabIndex: number;
  topUsersBadgeColor: string;
  topUserBadgeText: string;
  isTop3Users: boolean;
  isTop10Users: boolean;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private authService: AuthService,
    private afAuth: AngularFireAuth,
    private userService: UserService,
    private trendsService: TrendsService,
    private uiService: UiService,
    private breakpointService: BreakpointObserver
  ) { }

  ngOnInit() {
    this.subscriptions.add(this.route.params.pipe(
      switchMap(() => this.afAuth.authState)
    ).subscribe(user => {
      // get user profile id
      const profileId = this.route.snapshot.queryParams['upi'];

      if (user) {
        user.uid === profileId ? this.isProfileOwner = true : this.isProfileOwner = false;
      }

    }));

    this.subscriptions.add(this.authService.authChange.subscribe(
      (authState: boolean) => this.isAuth = authState
    ));

    this.subscriptions.add(this.route.data.subscribe(
      (userData: { user: GeneralData }) => this.user = userData.user
    ));

    this.subscriptions.add(this.route.queryParams.pipe(
      map((param: Params) => param['upi']),
      switchMap(upi => this.userService.getFriendById(upi)),
    ).subscribe(friendId => {

      if (friendId) {
        this.followBtnHidden = true;
      } else {
        this.followBtnHidden = false;
      }

    }));

    this.subscriptions.add(this.route.params.pipe(
      switchMap(() => this.trendsService.getTopPhotographersForRatingBadge()),
      map(photographers => {
        // get user profile id
        const profileId = this.route.snapshot.queryParams['upi'];
        // get current user if exist in top photographers
        const user = photographers.find(photographer => photographer.uid === profileId);
        // get current user index (+ 1 cuz index start from 0 wanna make it start from 1)
        const userIdx = photographers.indexOf(user) + 1;

        if (user) {

          switch (userIdx) {
            case 1:
              return 'gold';
              break;
            case 2:
              return 'silver';
              break;
            case 3:
              return 'bronze';
              break;
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
            case 9:
            case 10:
              return 'top 10';
              break;
            default:
              return 'top 10';
          }

        } else {

          return EMPTY;

        }

      })
    ).subscribe(result => {
      this.uiService.loadingState.next(false);

      if (result === 'gold') {

        this.topUsersBadgeColor = '#FEE101';
        this.isTop3Users = true;
        this.topUserBadgeText = 'Gold';

      } else if (result === 'silver') {

        this.topUsersBadgeColor = '#A7A7AD';
        this.isTop3Users = true;
        this.topUserBadgeText = 'Silver';

      } else if (result === 'bronze') {

        this.topUsersBadgeColor = '#A77044';
        this.isTop3Users = true;
        this.topUserBadgeText = 'Bronze';

      } else if (result === 'top 10') {

        this.topUsersBadgeColor = '#fa7c91';
        this.isTop10Users = true;
        this.topUserBadgeText = 'Top 10';

      }

    }));
  }

  private breakpointIsMatched(breakpoint: string, prefix = 'max'): boolean {
    return this.breakpointService.isMatched(`(${prefix}-width: ${breakpoint})`);
  }

  /**
   * on follow if user is authenticated serach in users in database (by userUID)
   * add this user (result from search) to the followers array of that user (user profile owner)
   * hide 'follow' button and show 'following' button
   * if user is not authenticated show sign in dialog
  */
  onFollow() {

    if (this.isAuth) {

      const profileId = this.route.snapshot.queryParams['upi'];
      this.userService.onAddFriendAndFollower(profileId);

    }

    if (!this.isAuth) {

      const dialogRef = this.dialog.open(LoginComponent, {
        backdropClass: 'backdrop',
        closeOnNavigation: true,
        autoFocus: false
      });

      if (this.breakpointIsMatched('480px')) {
        dialogRef.updateSize('88vw');
      } else if (this.breakpointIsMatched('768px')) {
        dialogRef.updateSize('70vw');
      } else if (this.breakpointIsMatched('992px')) {
        dialogRef.updateSize('60vw');
      } else if (this.breakpointIsMatched('1200px')) {
        dialogRef.updateSize('50vw');
      } else if (this.breakpointIsMatched('1201px', 'min')) {
        dialogRef.updateSize('600px');
      }

    }

  }

  /**
   * on unfollow search in followers array of that user (user profile owner)
   * if this user (userUID) exist (he follow that user)
   * remove him from followers array and show 'follow' button and hide 'following' button
  */
  onUnfollow() {
    const profileId = this.route.snapshot.queryParams['upi'];
    this.userService.onDeleteFriendAndFollower(profileId);
  }

  onHireMe() {

    const dialogRef = this.dialog.open(HireMeDialogComponent, {
      backdropClass: 'backdrop',
      closeOnNavigation: true,
      autoFocus: false,
      data: {
        userName: this.user.userName,
        email: this.user.email,
        socialLinks: this.user.socialLinks
      }
    });

    if (this.breakpointIsMatched('480px')) {
      dialogRef.updateSize('80vw');
    } else if (this.breakpointIsMatched('768px')) {
      dialogRef.updateSize('70vw');
    } else if (this.breakpointIsMatched('992px')) {
      dialogRef.updateSize('60vw');
    } else if (this.breakpointIsMatched('1200px')) {
      dialogRef.updateSize('50vw');
    } else if (this.breakpointIsMatched('1201px', 'min')) {
      dialogRef.updateSize('600px');
    }

  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.userService.cancelSubscription();
  }
}
