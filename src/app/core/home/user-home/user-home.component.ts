import { Component, OnInit, ViewEncapsulation, HostListener, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, transition, useAnimation } from '@angular/animations';
import { BreakpointObserver } from '@angular/cdk/layout';
import { AngularFireAuth } from '@angular/fire/auth';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

import { fadingAnimationStagger } from 'src/app/animations/fading-animation';
import { Photo } from '../../../models/photo.model';
import { ShareBtnsDialogComponent } from 'src/app/photo-preview/photo/share-btns-dialog/share-btns-dialog.component';
import { UserService } from 'src/app/services/user.service';
import { PhotoService } from 'src/app/services/photo.service';
import { PaginationService } from 'src/app/services/pagination.service';
import { ScrollPositionService } from 'src/app/services/scroll-position.service';
import * as dayjs from 'dayjs';
import * as relativeTime from 'dayjs/plugin/relativeTime';
import { SwiperConfigInterface } from 'ngx-swiper-wrapper';
import { TrendsService, GeneralDataWithUID } from 'src/app/services/trends.service';
import { UiService } from 'src/app/services/ui.service';
import { UploadDialogComponent } from 'src/app/upload-dialog/upload-dialog.component';
import { UploadService } from 'src/app/services/upload.service';

dayjs.extend(relativeTime);

interface Feed extends Photo {
  // likesIds: string[];
  isUserLikePhoto: boolean;
}

@Component({
  selector: 'ps-user-home',
  templateUrl: './user-home.component.html',
  styleUrls: ['./user-home.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('cardFadeIn', [
      transition('* <=> *', [
        useAnimation(fadingAnimationStagger, {
          params: {
            time: '.6s',
            easing: 'ease'
          }
        })
      ])
    ])
  ]
})
export class UserHomeComponent implements OnInit, OnDestroy {
  isLikeBtnClicked = false;
  today = new Date();
  windowW = window.innerWidth;
  feeds: Feed[];
  isUserHasPhotos: boolean;
  time = dayjs;
  topUsers?: GeneralDataWithUID[];
  config: SwiperConfigInterface = {
    a11y: true,
    slidesPerView: 3,
    spaceBetween: 10,
    grabCursor: true,
    breakpoints: {
      575.98: {
        slidesPerView: 2
      }
    },
    mousewheel: true,
    keyboard: true,
    zoom: false,
    navigation: {
      nextEl: '.next',
      prevEl: '.prev'
    }
  };
  private uid: string;
  private subscription: Subscription = new Subscription();

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private userService: UserService,
    private photoService: PhotoService,
    private afAuth: AngularFireAuth,
    private paginationService: PaginationService,
    private scrollPosition: ScrollPositionService,
    private trendsService: TrendsService,
    private uiService: UiService,
    private uploadService: UploadService,
    private breakpointService: BreakpointObserver
  ) { }

  ngOnInit() {
    // collect the feeds in database
    this.userService.collectionHomeFeeds();

    // get user id and initiate the first get for the feeds
    this.subscription.add(this.afAuth.authState.subscribe(user => {

      if (user) {

        this.paginationService.init(`users/${user.uid}/feeds`, 'publishedDate');
        this.userService.getUserPhotos(user.uid);
        this.uid = user.uid;

      }

    }));

    // get the data (feeds) from database
    // map the data to correct published date
    // subscribe for feeds and call `removeNotExistFeeds()`
    this.subscription.add(this.afAuth.authState.pipe(
      switchMap(() => this.paginationService.data$),
      map((feeds: Feed[]) => {

        return feeds.map(photo => {

          return {
            ...photo,
            publishedDate: new Date((<any>photo.publishedDate).seconds * 1000)
          };

        });

      }),
    ).subscribe(
      feeds => {

        this.feeds = feeds;
        this.userService.removeNotExistFeeds();

        if (!feeds.length) {

          this.subscription.add(this.trendsService.getTopPhotographers().subscribe(topUsers => {

            this.uiService.loadingState.next(false);
            this.topUsers = topUsers;

            // get current user idx from `topUsers` if exist
            const getCurrentUserIdx = this.topUsers.findIndex((user) => user.uid === this.uid);
            this.topUsers.splice(getCurrentUserIdx, 1);

          }));

        }

      }
    ));

    // if scroll hit the bottom, call `more()` to get more feeds
    this.subscription.add(this.scrollPosition.scrollPosition.subscribe(scrollPosition => {

      if (scrollPosition === 'bottom') {
        this.paginationService.more();
      }

    }));

    this.subscription.add(this.userService.userPhotos$.pipe(
      map(photos => {

        return photos.map(photo => {

          return {
            ...photo,
            publishedDate: new Date((<any>photo.publishedDate).seconds * 1000)
          };

        });

      })
    ).subscribe(photos => {

      photos.length ? this.isUserHasPhotos = true : this.isUserHasPhotos = false;

    }));
  }

  @HostListener('window:resize', []) onResize() {
    this.windowW = window.innerWidth;
  }

  /**
   *When user like the photo
   *
   * @param {string} photoId photo id
   * @param {number} idx index of the photo in `feeds[]`
   * @memberof UserHomeComponent
   * @method `addLikeRemoveLike()` to add or remove like in database
   *
   * if `isUserLikePhoto` true set it to false and vice versa,
   * this just to control in the color of the like btn for the user
   */
  onLikePhoto(photoId: string, idx: number) {

    this.photoService.addLikeRemoveLike(photoId);

    if (this.feeds[idx].isUserLikePhoto) {
      this.feeds[idx].isUserLikePhoto = false;
    } else {
      this.feeds[idx].isUserLikePhoto = true;
    }

  }

  onShare(photoId: string) {
    const dialogRef = this.dialog.open(ShareBtnsDialogComponent, {
      backdropClass: 'backdrop',
      closeOnNavigation: true,
      autoFocus: false,
      data: {
        url: `${this.router.url}/photo/${photoId}`    // TODO: check after host if it work correctly or not
      }
    });
  }

  private breakpointIsMatched(breakpoint: string, prefix = 'max'): boolean {
    return this.breakpointService.isMatched(`(${prefix}-width: ${breakpoint})`);
  }

  onUploadPhoto() {

    const wWidth = window.innerWidth;

    const dialogRef = this.dialog.open(UploadDialogComponent, {
      backdropClass: 'backdrop',
      closeOnNavigation: true,
      autoFocus: false
    });

    if (this.breakpointIsMatched('480px')) {
      dialogRef.updateSize('88vw');
    } else if (this.breakpointIsMatched('768px')) {
      dialogRef.updateSize('80vw');
    } else if (this.breakpointIsMatched('992px')) {
      dialogRef.updateSize('70vw');
    } else if (this.breakpointIsMatched('1200px')) {
      dialogRef.updateSize('60vw');
    } else if (this.breakpointIsMatched('1201px', 'min')) {
      dialogRef.updateSize('1100px');
    }


    dialogRef.afterClosed().subscribe((isSubmited: boolean) => {

      if (isSubmited) {

        this.uploadService.onSubmitUploadedPhotos();

      } else if (typeof isSubmited === 'undefined' || false) {

        this.uploadService.onUnsubmit();

      }

    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.userService.cancelSubscription();
    this.photoService.cancelSubscription();
    this.paginationService.cancelSubscription();
    this.scrollPosition.scrollPosition.next(null);
    this.uiService.loadingState.next(false);
  }
}
