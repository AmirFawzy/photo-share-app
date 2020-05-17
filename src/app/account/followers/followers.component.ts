import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { trigger, transition, useAnimation } from '@angular/animations';
import { Subscription } from 'rxjs';

import { FollowersFriends } from '../../models/followers-friends.model';
import { UserService } from '../../services/user.service';
import { UiService } from '../../services/ui.service';
import { fadingStaggerAnimation } from 'src/app/animations/fading-animation';

@Component({
  selector: 'ps-followers',
  templateUrl: './followers.component.html',
  styleUrls: ['./followers.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('listAnimation', [
      transition('* <=> *', [
        useAnimation(fadingStaggerAnimation(':enter', '.5s', 'ease', 100))
      ])
    ])
  ]
})
export class FollowersComponent implements OnInit, OnDestroy {
  friends: FollowersFriends[];
  loadingState = false;
  private subscription: Subscription[] = [];

  constructor(private userService: UserService, private uiService: UiService) { }

  ngOnInit() {
    /**
     * push subscription to the array of subscriptions
     * subscribe for followers to [this.followers]
     * sort followers by alphabetical
     * stop the loading (start it from 'this.userService')
     */
    this.subscription.push(this.userService.getFriendsIds(false).subscribe(
      (friendsIds: string[]) => {

        if (friendsIds) {

          for (const friendId of friendsIds) {
            this.userService.getFriendData(friendId);
          }

        } else {

          this.friends = [];
          this.uiService.loadingState.next(false);

        }

        if (!friendsIds.length) {

          this.friends = [];
          this.uiService.loadingState.next(false);

        }

      }
    ));

    /**
     * subscribe for `friends$` get friends list
     * reassign `friends` property then sort it and stop the loading
     */
    this.subscription.push(this.userService.friends$.subscribe(
      (friends: FollowersFriends[]) => {

        this.friends = friends;
        this.friends.sort(this.sortByAlphabet);
        this.uiService.loadingState.next(false);

      }
    ));

    // push new subscribe to subscriptions array and subscribe for [this.loadingState]
    this.subscription.push(this.uiService.loadingState.subscribe(
      (state: boolean) => this.loadingState = state
    ));
  }

  private sortByAlphabet(a: FollowersFriends, b: FollowersFriends): number {

    if (a.userName.toLowerCase() < b.userName.toLowerCase()) {
      return -1;
    }

    if (a.userName.toLowerCase() > b.userName.toLowerCase()) {
      return 1;
    }

    return 0;

  }

  onUnfollow(friendId: string) {
    this.userService.onDeleteFriendAndFollower(friendId);
  }

  ngOnDestroy() {
    this.subscription.forEach(sub => sub.unsubscribe());
    this.userService.cancelSubscription();
  }
}
