import { Component, OnInit, ViewEncapsulation, OnDestroy, HostListener } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { AngularFireAuth } from '@angular/fire/auth';
import { map, switchMap } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { Photo } from 'src/app/models/photo.model';
import { AuthService } from 'src/app/services/auth.service';
import { PhotoService } from 'src/app/services/photo.service';
import { UserService } from 'src/app/services/user.service';
import { LoginComponent } from 'src/app/shared/login/login.component';

@Component({
  selector: 'ps-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DetailsComponent implements OnInit, OnDestroy {
  photo: Photo;
  private userId: string;
  isOwner = false;
  followingBtnText = 'Following';
  followingBtnColor = 'accent';
  followBtnHidden = false;
  isAccordionEpanded = true;
  numOfFollowers: number;
  numOfViews = 0;
  friendId: string = null;
  isAuth: boolean;
  private subscriptions: Subscription[] = [];

  constructor(
    private dialog: MatDialog,
    private authService: AuthService,
    private photoService: PhotoService,
    private afAuth: AngularFireAuth,
    private userService: UserService,
    private breakpointService: BreakpointObserver
  ) { }

  ngOnInit() {
    // subscribe for `authChange` to get if the user login or not
    this.subscriptions.push(this.authService.authChange.subscribe(
      (authState: boolean) => this.isAuth = authState)
    );

    // subscribe for `authState` to get user id
    this.subscriptions.push(this.afAuth.authState.subscribe(
      user => user ? this.userId = user.uid : this.userId = null
    ));

    /**
     * Subscribe for `authState` to make sure that the user loged in
     * use `switchMap` to switch the output
     * @if true -- `getFollowers()`
     * use `map` to mutate the result to the number
     * @param {number} num assign to `numOfFollowers`
     */
    this.subscriptions.push(this.afAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          return this.userService.getFollowers();
        }
      }),
      map((result) => {
        if (result.exist) {
          return (<string[]>result.data.followersIds).length;
        } else {
          return 0;
        }
      })).subscribe(
        num => this.numOfFollowers = num
      ));

    // subscribe for photo data object recived
    this.subscriptions.push(this.photoService.photo$.subscribe(
      (photo: Photo) => {
        this.photo = photo;
        if (this.userId === photo.owner.id) {
          this.isOwner = true;
        } else {
          this.isOwner = false;
        }
      }
    ));

    /**
     * subscribe for the photo to make sure it gets the photo object from database first
     * get the 'photoId' from `photo$` reason of subscribe for `photo$` first
     * @param {Photo} photo photo data object
     * use `switchMap` to switch the observable recivied to `getViews()`
     * subscribe for `getViews` and set `numOfViews`
     */
    this.subscriptions.push(this.photoService.photo$.pipe(
      switchMap(photo => this.photoService.getViews(photo.id))
    ).subscribe(
      views => this.numOfViews = views
    ));

    /**
     * subscribe for `authState` switch to `photo$` then switch to `getFriendById`
     * that to make sure reaching to `uid` and `photo` before getting friend
     *
     * @if true -- assign `friendId` and set `followBtnHidden` to true
     * @else false -- assign `friendId` to null and `followBtnHidden` to false
     */
    this.subscriptions.push(this.afAuth.authState.pipe(
      switchMap(user => user ? this.photoService.photo$ : null),
      switchMap(photo => photo ? this.userService.getFriendById(photo.owner.id) : null),
    ).subscribe(friendId => {
      if (friendId) {
        this.friendId = friendId;
        this.followBtnHidden = true;
      } else {
        this.friendId = null;
        this.followBtnHidden = false;
      }
    }));

    if (this.breakpointIsMatched('768px')) {
      this.isAccordionEpanded = false;
    }
  }

  private breakpointIsMatched(breakpoint: string, prefix = 'max'): boolean {
    return this.breakpointService.isMatched(`(${prefix}-width: ${breakpoint})`);
  }

  @HostListener('window:resize', []) onResize() {
    if (this.breakpointIsMatched('768px')) {
      this.isAccordionEpanded = false;
    } else {
      this.isAccordionEpanded = true;
    }
  }

  onFollow() {
    if (this.isAuth) {
      this.userService.onAddFriendAndFollower(this.photo.owner.id);
    }

    if (!this.isAuth) {
      const dialogRef = this.dialog.open(LoginComponent, {
        backdropClass: 'backdrop',
        closeOnNavigation: true,
        autoFocus: false
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
  }

  onUnfollow() {
    this.userService.onDeleteFriendAndFollower(this.friendId);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

}
