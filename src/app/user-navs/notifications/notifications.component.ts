import { Component, OnInit, ElementRef, ViewChild, ViewEncapsulation } from '@angular/core';

import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { MenuDimension } from '../user/user.component';
import { Notification } from 'src/app/models/notification.model';
import * as dayjs from 'dayjs';
import * as relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

@Component({
  selector: 'ps-notifications-menu',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class NotificationsComponent implements OnInit {
  @ViewChild('menuContainer', { static: true }) menuContainerEle: ElementRef;
  config: PerfectScrollbarConfigInterface = {};
  menuSize: MenuDimension;
  today = new Date();
  time = dayjs;
  // may change in future
  notifications: Notification[] = [{
    id: '1',
    date: new Date(),
    notificationText: 'posted new comment on your photo the heaven.',
    link: `'/photo', 3`,
    owner: {
      userName: 'lana addams',
      profilePhoto: ''
    }
  },
  {
    id: '2',
    date: new Date(2018, 10, 13),
    notificationText: 'new follower in your list.',
    link: `'/photo', 8`,
    owner: {
      userName: 'Gerard Ach',
      profilePhoto: ''
    }
  },
  {
    id: '3',
    date: new Date(2018, 9, 12),
    notificationText: 'like your photo piece of heaven.',
    link: `'/photo', 1`,
    owner: {
      userName: 'Maxmilian Zukhanum',
      profilePhoto: ''
    }
  },
  {
    id: '4',
    date: new Date(2018, 7, 19),
    notificationText: 'added your photo piece of heaven to collection.',
    link: `'/user', 3`,
    owner: {
      userName: 'Sergi Valder',
      profilePhoto: ''
    }
  },
  {
    id: '5',
    date: new Date(2018, 9, 15),
    notificationText: 'your photo piece of heaven is treding now.',
    link: `/trends`,
    owner: {
      userName: 'PHS Team',
      profilePhoto: '../../../assets/images/phs-team.png'
    }
  },
  {
    id: '6',
    date: new Date(2018, 9, 3),
    notificationText: 'you are num 28 in our top 100 photographers... congrats.',
    link: `/trends`,
    owner: {
      userName: 'PHS Team',
      profilePhoto: '../../../assets/images/phs-team.png'
    }
  }];

  constructor() { }

  ngOnInit() {
    this.menuSize = {
      width: this.menuContainerEle.nativeElement.clientWidth,
      height: this.menuContainerEle.nativeElement.clientHeight
    };

    this.notifications.sort(this.sortNotifications);
  }

  // sort by date method
  private sortNotifications(a: Notification, b: Notification): number {
    if (a.date > b.date) {
      return -1;
    }
    if (a.date < b.date) {
      return 1;
    }
    return 0;
  }

}
