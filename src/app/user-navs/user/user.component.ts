import { Component, OnInit, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subscription, EMPTY } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { User } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';
import { TrendsService, GeneralDataWithUID } from 'src/app/services/trends.service';

export interface Items {
  text: string;
  icon?: string;
  routePath?: string;
}

export interface MenuDimension {
  width: number;
  height: number;
}

@Component({
  selector: 'ps-user-menu',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class UserComponent implements OnInit {
  @ViewChild('menuContainer', { static: true }) private menuContainerEle: ElementRef<HTMLElement>;
  user: User;
  listItems1: Items[] = [
    {
      text: 'my photos',
      icon: 'photo',
    },
    {
      text: 'my collections',
      icon: 'photo_library',
    },
    {
      text: 'my profile',
      icon: 'account_box',
    }
  ];
  listItems2: Items[] = [
    {
      text: 'settings',
      icon: 'settings',
      routePath: '/account/settings'
    },
    {
      text: 'followers',
      icon: 'group',
      routePath: '/account/followers'
    },
    {
      text: 'jobs',
      icon: 'work',
      routePath: '/jobs'
    }
  ];
  config: PerfectScrollbarConfigInterface = {};
  menuSize: MenuDimension;
  topUsersBadgeColor: string;
  topUserBadgeText: string;
  isTop3Users: boolean;
  isTop10Users: boolean;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private afAuth: AngularFireAuth,
    private trendsService: TrendsService
  ) { }

  ngOnInit() {
    this.authService.authChange.pipe(
      switchMap((user) => {

        if (user) {
          return this.userService.getUserDataForMenu();
        }

        return EMPTY;

      })
    ).subscribe(
      (user: User | never) => this.user = user
    );

    this.menuSize = {
      width: this.menuContainerEle.nativeElement.clientWidth,
      height: this.menuContainerEle.nativeElement.clientHeight
    };

    this.authService.authChange.pipe(
      switchMap((isAuth) => {

        if (isAuth) {
          return this.trendsService.getTopPhotographersForRatingBadge();
        }

        return EMPTY;

      }),
      map((photographers: GeneralDataWithUID[] | never) => {

        // user uid
        const uid = this.afAuth.auth.currentUser.uid;

        if (photographers) {
          // get current user if exist in top photographers
          const user = photographers.find(photographer => photographer.uid === uid);
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

            return;

          }

        }

      })
    ).subscribe(result => {

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

      } else if (typeof result === 'undefined') {

        this.isTop3Users = false;
        this.isTop10Users = false;

      }

    });

  }

  signout() {
    // this.userService.cancelSubscription();
    this.authService.signout();
    this.authService.intialAuthListener();
  }

}
