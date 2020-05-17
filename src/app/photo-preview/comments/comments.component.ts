import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgForm } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { LoginComponent } from 'src/app/shared/login/login.component';
import { AuthService } from 'src/app/services/auth.service';
import { PhotoService } from 'src/app/services/photo.service';
import { UiService } from 'src/app/services/ui.service';
import { Comment } from 'src/app/models/comment.model';
import * as dayjs from 'dayjs';
import * as relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

@Component({
  selector: 'ps-comments',
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.scss'],
  animations: [
    trigger('openReplay', [
      state('true', style({ height: '*' })),
      state('false', style({ height: '0', overflow: 'hidden' })),
      transition('true <=> false', animate('200ms ease-in-out'))
    ])
  ]
})
export class CommentsComponent implements OnInit, OnDestroy {
  @ViewChild('commentForm', { static: false }) commentForm: NgForm;
  photoId: string;
  replayIdx: number;
  isAuth: boolean;
  comments: Comment[];
  replays: Comment[] = [];
  userId: string;
  today = new Date();
  time = dayjs;
  private subscriptions: Subscription[] = [];

  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private authService: AuthService,
    private photoService: PhotoService,
    private afAuth: AngularFireAuth,
    private uiService: UiService,
    private breakpointService: BreakpointObserver
  ) { }

  ngOnInit() {
    // Get the photo id
    this.photoId = this.route.snapshot.params['id'];

    /**
     * subscribe for `comments$`
     * assign `comments` then sort it by latest then sort it by user
     * to make current user comments on the top
     * @loop on comments and excute
     * @method getOwnerCommentData to get the data owner data for all comments
     * @method getReplays to get all replays on all comments
     */
    this.subscriptions.push(this.photoService.comments$.subscribe(
      comments => {
        this.comments = comments;
        this.comments.sort(this.sortByLatest);
        this.comments.sort((a: Comment, b: Comment) => {
          if (a.owner.id === this.userId) {
            return -1;
          }
          if (a.owner.id === this.userId) {
            return 1;
          }
          return 0;
        });

        comments.forEach(comment => {
          this.photoService.getOwnerCommentData(comment.owner.id);
          this.photoService.getReplays(this.photoId, comment.id);
        });
      }
    ));

    /**
     * subscribe for `commentsOwners$` holds all comments owners data
     * stop loading and loop on owners data and `comments`
     * @if true -- set `owner.userName` and `owner.userPhoto` in comments
     */
    this.subscriptions.push(this.photoService.commentsOwners$.subscribe(
      ownersData => {
        this.uiService.loadingState.next(false);
        ownersData.forEach(owner => {
          this.comments.forEach((comment, idx) => {
            if (comment.owner.id === owner.userId) {
              this.comments[idx].owner.userName = owner.userName;
              this.comments[idx].owner.userPhoto = owner.userPhoto;
            }
          });
        });
      }
    ));

    /**
     * subscribe for  to make sure from got result from observable `comments$` and `commentsOwners$` first
     * @loop throw param [replays]
     * @constant {Comment} filterReplays the comment in replays if exist
     * @if true -- push [replay] to `replays`
     * @method getReplayOwnerData excute to get replays owners data
     */
    this.subscriptions.push(this.photoService.comments$.pipe(
      switchMap(() => this.photoService.commentsOwners$),
      switchMap(() => this.photoService.replays$)
    ).subscribe(replays => {
      this.uiService.loadingState.next(false);
      replays.forEach(replay => {
        const filterReplays = this.replays.find(r => r.id === replay.id);
        if (!filterReplays) {
          this.replays.push(replay);
        }

        this.photoService.getReplayOwnerData(replay.owner.id);
      });
    }));

    /**
     * subscribe for `replaysOwners$` to get replays owners data
     * @loop [ownerData] and `replays`
     * @if true -- set `owner.userName` and `owner.userPhoto`
     */
    this.subscriptions.push(this.photoService.replaysOwners$.subscribe(
      ownerData => {
        ownerData.forEach(owner => {
          this.replays.forEach((replay, idx) => {
            if (owner.userId === replay.owner.id) {
              this.replays[idx].owner.userName = owner.userName;
              this.replays[idx].owner.userPhoto = owner.userPhoto;
            }
          });
        });
      }
    ));

    /**
     * subscribe for `comments$` and `commentsOwners$` and `replays$` then `replaysOwners$`
     * why that? to make sure that i already received all data from this observables
     * @loop `replays` and `comments` to set replays to their comments
     * @constant {Comment} replays to filter the replay if exist
     * @if true -- indeed it's not exist in replays[] push this replays to `comment.replays`
     * then sort the replays depends on the oldest
     */
    this.subscriptions.push(this.photoService.comments$.pipe(
      switchMap(() => this.photoService.commentsOwners$),
      switchMap(() => this.photoService.replays$),
      switchMap(() => this.photoService.replaysOwners$),
    ).subscribe(() => {
      for (const replay of this.replays) {
        for (const comment of this.comments) {
          if (replay.parentCommentId === comment.id) {

            const filterReplay = comment.replays.find(r => r.id === replay.id);

            if (!filterReplay) {
              comment.replays.push(replay);
              comment.replays.sort(this.sortByOldest);
            }

          }
        }
      }
    }));

    // subscribe for `authChange` to get if the user logedin or not
    this.subscriptions.push(this.authService.authChange.subscribe(
      (authState: boolean) => this.isAuth = authState
    ));

    // subscribe for `authState` to get user id
    this.subscriptions.push(this.afAuth.authState.subscribe(user => {
      user ? this.userId = user.uid : this.userId = null;
    }));
  }

  /**
   *Sort by the latest
   *
   * @private
   * @param {Comment} a the first comment to compare with
   * @param {Comment} b the second comment to compare with
   * @returns {number}
   * @memberof CommentsComponent
   */
  private sortByLatest(a: Comment, b: Comment): number {
    if (a.publishedDate > b.publishedDate) {
      return -1;
    }
    if (a.publishedDate < b.publishedDate) {
      return 1;
    }
    return 0;
  }

  /**
   *Sort by oldest
   *
   * @private
   * @param {Comment} a the first comment to compare with
   * @param {Comment} b the second comment to compare with
   * @returns {number}
   * @memberof CommentsComponent
   */
  private sortByOldest(a: Comment, b: Comment): number {
    if (a.publishedDate > b.publishedDate) {
      return 1;
    }
    if (a.publishedDate < b.publishedDate) {
      return -1;
    }
    return 0;
  }

  private breakpointIsMatched(breakpoint: string, prefix = 'max'): boolean {
    return this.breakpointService.isMatched(`(${prefix}-width: ${breakpoint})`);
  }

  /**
   *On submit new comment
   *
   * @param {NgForm} form form class with all properties
   * @memberof CommentsComponent
   *
   * @if true -- if authenticated submit form
   * @constant {string} comment is the text of the comment
   * @method `addComment` to add new comment in db
   */
  onSubmitComment(form: NgForm) {

    if (this.isAuth) {
      const comment = form.value.comment;

      this.photoService.addComment(this.photoId, comment);

      // reste form after submit
      this.commentForm.reset();
    }

    // if not authenticated show sign-in dialog
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

  /**
   *Delete the comment
   *
   * @param {string} commentId
   * @memberof CommentsComponent
   * @method `deleteComment` to delete the comment from db
   */
  onDeleteComment(commentId: string) {
    this.photoService.deleteComment(this.photoId, commentId);
  }

  /**
   *On click on replay button
   *
   * @param {number} idx is the index of the replay
   * @memberof CommentsComponent
   *
   * assign `replayIdx` to trigger the animation of the replay form
   */
  onReplay(idx: number) {
    this.replayIdx = idx;
  }

  /**
   *On submit a replay
   *
   * @param {NgForm} form the form class with it's properties
   * @param {string} commentId comment id (the comment which this replay inside it)
   * @memberof CommentsComponent
   * @constant {string} replay the text of the replay
   * @if true -- replay has a length and is not just a whitespace
   * @method `addReplay` to add replay to this comment and send it to db then reset the form
   * @method `getReplays` to get new replay been just added
   */
  onSubmitReplay(form: NgForm, commentId: string) {
    const replay = form.value.replay as string;

    if (replay.trim().length) {
      this.photoService.addReplay(this.photoId, commentId, replay);
      form.reset();

      this.photoService.getReplays(this.photoId, commentId);
    }
  }

  /**
   *On delete replay
   *
   * @param {string} commentId comment doc id that replay in it
   * @param {string} replayId replay doc id
   * @memberof CommentsComponent
   * @method `deleteReplay` to delete the replay form db
   * @loop `replays[]` and delete that replay intended to delete from replays[]
   * @loop `comments[]` and delete that replay form replays in comments[]
   */
  onDeleteReplay(commentId: string, replayId: string) {
    this.photoService.deleteReplay(this.photoId, commentId, replayId);

    this.replays.forEach((replay, idx) => {
      if (replay.id === replayId) {
        this.replays.splice(idx, 1);
      }
    });

    this.comments.forEach((comment, idx) => {
      if (comment.id === commentId) {
        this.comments[idx].replays = [];
      }
    });
  }

  // unsbscribe for all subscription
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

}
