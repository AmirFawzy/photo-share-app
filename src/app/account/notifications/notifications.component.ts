import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Subscription } from 'rxjs';

import { Notification } from '../../models/notification.model';
import { UserService } from '../../services/user.service';
import { UiService } from '../../services/ui.service';
import * as dayjs from 'dayjs';
import * as relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

@Component({
  selector: 'ps-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class NotificationsAccComponent implements OnInit, OnDestroy {
  today = new Date();
  time = dayjs;
  notifications: Notification[];
  loadingState = false;
  sendNotificationsByEmail = false;
  private subscriptions: Subscription = new Subscription();

  constructor(private userService: UserService, private uiService: UiService) { }

  ngOnInit() {
    // get user notifications from db
    this.userService.getNotifications();
    this.userService.getUserAccountSettings();

    /**
     * push new subscription to @property {Supscription[]} supscriptions
     * subscribe for [notifications$] to @property {Notification[]} notifications
     */
    this.subscriptions.add(this.userService.notifications$.subscribe(
      (notifications: Notification[]) => this.notifications = notifications
    ));

    // subscribe for loading state
    this.subscriptions.add(this.uiService.loadingState.subscribe(
      (state: boolean) => this.loadingState = state
    ));

    this.subscriptions.add(this.userService.accountSettings$.subscribe(
      settings => this.sendNotificationsByEmail = settings.notificationsByEmail
    ));
  }

  /**
   * on check or uncheck to get notifications by email
   * @param evt the MatCheckboxChange
   * update user settings in database
   */
  onChange(evt: MatCheckboxChange) {
    this.userService.updateUserAccountSettings({ notificationsByEmail: evt.checked });
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

}
