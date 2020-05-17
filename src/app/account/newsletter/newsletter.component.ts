import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Subscription } from 'rxjs';

import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'ps-newsletter',
  templateUrl: './newsletter.component.html',
  styleUrls: ['./newsletter.component.scss']
})
export class NewsletterComponent implements OnInit, OnDestroy {
  newsletterState = false;
  private subscriptions: Subscription = new Subscription();

  constructor(private userService: UserService) { }

  ngOnInit() {
    this.userService.getUserAccountSettings();

    this.subscriptions.add(this.userService.accountSettings$.subscribe(
      settings => this.newsletterState = settings.newsletterSubscription
    ));
  }

  onChange(evt: MatCheckboxChange) {
    this.userService.updateUserAccountSettings({ newsletterSubscription: evt.checked });
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
