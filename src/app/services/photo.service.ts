import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { Subject, Subscription, Observable, BehaviorSubject } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';

import { Photo } from '../models/photo.model';
import { UiService } from './ui.service';
import { Comment } from '../models/comment.model';
import { Collection } from '../models/collection.model';

interface CommentOwnerData {
  userId: string;
  userName: string;
  userPhoto: string;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  /**
     *Hold the photo pbject
     *
     * @type {Subject<Photo>}
     * @memberof PhotoService
     */
  photo$: Subject<Photo> = new Subject();

  /**
   *Refer to if the user like or not the photo
   *
   * @type {BehaviorSubject<boolean>}
   * @memberof PhotoService
   */
  likeState$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  /**
   *Holds all the comments on the photo
   *
   * @type {Subject<Comment[]>}
   * @memberof PhotoService
   */
  comments$: Subject<Comment[]> = new Subject();

  /**
   *Holds all comments owners data used to get all owners then emits it in `commentsOwners$`
   *
   * @private
   * @type {CommentOwnerData[]}
   * @memberof PhotoService
   */
  private commentsOwnersData: CommentOwnerData[] = [];

  /**
   *Holds all owners of the comments
   *
   * @type {Subject<CommentOwnerData[]>}
   * @memberof PhotoService
   */
  commentsOwners$: Subject<CommentOwnerData[]> = new Subject();

  /**
   *Holds all replays of all comments on the photo
   *
   * @type {Subject<Comment[]>}
   * @memberof PhotoService
   */
  replays$: Subject<Comment[]> = new Subject();

  /**
   *Holds all replays owners data used to get all owners data and emits it in `replaysOwners$`
   *
   * @private
   * @type {CommentOwnerData[]}
   * @memberof PhotoService
   */
  private replaysOwnersData: CommentOwnerData[] = [];

  /**
   *Holds all owners of the replays
   *
   * @type {Subject<CommentOwnerData[]>}
   * @memberof PhotoService
   */
  replaysOwners$: Subject<CommentOwnerData[]> = new Subject();

  /**
   *Current user id
   *
   * @private
   * @type {string}
   * @memberof PhotoService
   */
  private userId: string;
  private subscriptions: Subscription[] = [];

  constructor(
    private afAuth: AngularFireAuth,
    private db: AngularFirestore,
    private uiService: UiService,
    private router: Router,
    private storage: AngularFireStorage
  ) {

    this.afAuth.authState.subscribe(user => {

      if (user) {
        this.userId = user.uid;
      } else {
        this.userId = null;
      }

    });

  }

  /**
   *Get photo form db
   *
   * @param {string} photoId
   * @memberof PhotoService
   * @emits true to `loadingState` to start loading
   *
   * use `debounceTime` to keep trace of changes on the document in db then take `first()` value
   *
   * use `mergeMap` to merge [photo<Photo>] with [downloadUrl<Observable>] then `map` benefits of doing so
   * to make sure on every request of this photo it will get the download url of it in case
   * download url changes in storage for any reason
   *
   * @param {Photo} photo the photo object
   * @returns new photo object with `publishedDate` mutate
   *
   * use `mergeMap` to merge two values in the output
   *
   * @param {Photo} photo
   * @param {User} accountSettings user account settings
   *
   * use `map` to mutate 'userName' and 'profilePhoto' in the `photo` object
   *
   * @emits false to `loadingState` to stop loading
   * @emits photo to `photo$`
   *
   * @emits false to stop loading, show error message and emits `null` to `photo$` if there's error
   */
  getPhoto(photoId: string) {

    // this.uiService.loadingState.next(true);

    this.subscriptions.push(this.db.doc(`photos/${photoId}`).valueChanges().pipe(
      debounceTime(200),
      map((photo: Photo) => {

        return {
          ...photo,
          publishedDate: new Date((<any>photo.publishedDate).seconds * 1000)
        };

      })
    ).subscribe(
      (photo: Photo) => {

        this.uiService.loadingState.next(false);
        this.photo$.next(photo);

      },
      error => {

        this.uiService.loadingState.next(false);
        this.uiService.respondMessage('Network connection lost! please try again');
        this.photo$.next(null);

      }
    ));

  }

  /**
   *On edit photo
   *
   * @param {string} photoId photo id
   * @param {Photo} newEdit new edit on photo
   * @memberof PhotoService
   ** send `newEdit` to db with `merge` flag
   */
  updatePhoto(photoId: string, newEdit: Photo) {

    this.uiService.loadingState.next(true);

    this.db.doc<Photo>(`photos/${photoId}`).set({ ...newEdit }, { merge: true })
      .then(() => {

        this.getPhoto(photoId);

      })
      .catch(error => {

        this.uiService.loadingState.next(false);
        this.uiService.respondMessage('Network connection lost! please try again');

      });

  }

  /**
   *On delete photo
   *
   * @param {Photo} photo object holds all photo settings
   * @memberof PhotoService
   *
   ** navigate back to the home page
   ** delete the photo from database
   ** delete the photo id form collections if it exists in any collection
   ** delete the photo from storage
   */
  deletePhoto(photo: Photo, route = true): Promise<void> {

    // tslint:disable-next-line:no-unused-expression
    route ? this.router.navigate(['/']) : null;

    return this.db.doc(`photos/${photo.id}/views/views`).delete()
      .then(async () => {

        const likes = await this.db.firestore.doc(`photos/${photo.id}/likes/likes`).get();
        if (likes.exists) {
          await this.db.doc(`photos/${photo.id}/likes/likes`).delete();
        }

        const comments = await this.db.firestore.collection(`photos/${photo.id}/comments`).get();
        if (!comments.empty) {

          await this.db.collection(`photos/${photo.id}/comments`).get().subscribe(async snapshot => {

            await snapshot.docs.forEach(async doc => {

              await this.db.doc(doc.ref).delete();

            });

          });

        }

        const collections = await this.db.collection<Collection>('galleries').get().toPromise();
        await collections.forEach(async collection => {

          if (collection.exists) {

            const photosProperty = collection.data().photos as Array<string>;
            const photoIdToRemove = photosProperty.find(id => id === photo.id);
            const photoIdToRemoveIdx = photosProperty.indexOf(photoIdToRemove);

            photosProperty.splice(photoIdToRemoveIdx, 1);

            await this.db.doc(`galleries/${collection.id}`)
              .set({ photos: photosProperty }, { merge: true });

          }

        });

      })
      .then(() => {

        this.db.doc(`photos/${photo.id}`).delete()
          .then(() => {

            this.storage.ref(`${photo.photo.storagePath}`).delete();
            this.storage.ref(`${photo.thumbnails.thum500.storagePath}`).delete();

          });

      })
      .then(() => {

        this.uiService.respondMessage('Photo deleted successfully');

      });

  }

  /**
   *Add one view to photo when it open
   *
   * @param {string} photoId photo document id in database
   * @memberof PhotoService
   *
   * get the photo snapshot and `take()` only one result then user `map()` to get photo data object
   *
   * add one view to the photo 'views' in database
   */
  addViews(photoId: string) {

    this.subscriptions.push(this.db.doc(`photos/${photoId}/views/views`).get().pipe(
      map(snapshot => snapshot.data().views)
    ).subscribe((views: number) => {

      this.db.doc(`photos/${photoId}/views/views`).set({ views: views + 1 }, { merge: true });

    }));

  }

  /**
   *Get the photo views number
   *
   * @param {string} photoId photo document id
   * @returns {Observable<number>}
   * @memberof PhotoService
   */
  getViews(photoId: string): Observable<number> {

    return this.db.doc(`photos/${photoId}/views/views`).get().pipe(
      map(snapshot => snapshot.data().views as number)
    );

  }

  /**
   *When user like a photo
   *
   * @param {string} photoId photo doc id
   * @memberof PhotoService
   *
   * @if true -- delete user (current user) from `likes` array and send it back to db
   * @else false -- add user (current user) to `likes` array then send it to db
   */
  addLikeRemoveLike(photoId: string) {

    this.subscriptions.push(this.db.doc(`photos/${photoId}/likes/likes`).get().pipe(
      map(snapshot => snapshot.data().likes)
    ).subscribe((likes: string[]) => {

      if (likes.includes(this.userId)) {

        likes.splice(likes.indexOf(this.userId), 1);
        this.db.doc(`photos/${photoId}/likes/likes`).set({ likes: likes }, { merge: true });

      } else {

        likes.push(this.userId);
        this.db.doc(`photos/${photoId}/likes/likes`).set({ likes: likes }, { merge: true });

      }

    }));

  }

  /**
   *Get likes num of the photo
   *
   * @param {string} photoId photo doc id
   * @memberof PhotoService
   *
   * observe the changes on likes document user `map` to get the likes property from db
   *
   * @emits likes.length to `likesLength$`
   * @if true
   * @emits true to `likeState$` otherwise emit false
   */
  getLikes(photoId: string) {

    this.subscriptions.push(this.db.doc(`photos/${photoId}/likes/likes`).valueChanges().pipe(
      map(docData => (<any>docData).likes as string[])
    ).subscribe(likes => {

      likes.includes(this.userId) ? this.likeState$.next(true) : this.likeState$.next(false);

    }));

  }

  /**
   *Add comment to photo
   *
   * @param {string} photoId photo doc id
   * @param {string} comment text of the comment to add
   * @memberof PhotoService
   */
  addComment(photoId: string, comment: string) {

    const docId: string = this.db.createId();

    this.db.doc<Comment>(`photos/${photoId}/comments/${docId}`).set({
      id: docId,
      owner: {
        id: this.userId
      },
      comment: comment,
      publishedDate: new Date(),
      replays: []
    });

  }

  /**
   *Get all comments for the photo
   *
   * @param {string} photoId photo doc id
   * @memberof PhotoService
   *
   * use `map` to mutate the data and change the [publishedDate] on every comment
   *
   * @emits `comments` after mutation to `comments$`
   */
  getComments(photoId: string) {

    // this.uiService.loadingState.next(true);

    this.subscriptions.push(this.db.collection<Comment>(`photos/${photoId}/comments`).valueChanges().pipe(
      debounceTime(200),
      map(commentsArr => {

        return commentsArr.map(comment => {

          return {
            ...comment,
            publishedDate: new Date((<any>comment.publishedDate).seconds * 1000)
          };

        });

      })
    ).subscribe(comments => {

      this.comments$.next(comments);

    }));

  }

  /**
   *Get owner comment data (userName, userPhoto)
   *
   * @param {string} userId user id in db
   * @memberof PhotoService
   *
   * user `map` to change the output and extract the data from snapshot
   *
   * push owner data to `commentsOwnersData`
   *
   * @emits `commentsOwnersData` to `commentsOwners$`
   */
  getOwnerCommentData(userId: string) {

    this.subscriptions.push(this.getUserData(userId).subscribe(ownerData => {

      this.commentsOwnersData.push(ownerData);
      this.commentsOwners$.next(this.commentsOwnersData);

    }));

  }

  /**
   *Delete comment
   *
   * @param {string} photoId photo doc id
   * @param {string} commentId comment doc id
   * @memberof PhotoService
   */
  deleteComment(photoId: string, commentId: string): Promise<void> {

    const replays = this.db.collection(`photos/${photoId}/comments/${commentId}/replays`).get().toPromise();

    return replays
      .then(snapshot => {

        snapshot.forEach(doc => {
          doc.ref.delete();
        });

      })
      .then(() => {

        return this.db.doc(`photos/${photoId}/comments/${commentId}`).delete();

      })
      .catch(error => {

        this.uiService.respondMessage('Network connection lost! please try again');

      });
  }

  /**
   *On add replay send new replay to db
   *
   * @param {string} photoId photo doc id
   * @param {string} commentId comment doc id
   * @param {string} replay replay text
   * @memberof PhotoService
   */
  addReplay(photoId: string, commentId: string, replay: string) {

    const docId = this.db.createId();

    this.db.doc<Comment>(`photos/${photoId}/comments/${commentId}/replays/${docId}`).set({
      id: docId,
      parentCommentId: commentId,
      owner: {
        id: this.userId
      },
      comment: replay,
      publishedDate: new Date()
    });

  }

  /**
   *Get all replays of photo from db
   *
   * @param {string} photoId photo doc id
   * @param {string} commentId comment doc id
   * @memberof PhotoService
   *
   * start the loading
   *
   * use `map` to mutate the data and change the [publishedDate] to defined date
   *
   * @emits `replays$` with replays array
   */
  getReplays(photoId: string, commentId: string) {

    // this.uiService.loadingState.next(true);

    this.subscriptions.push(this.db.collection<Comment>(`photos/${photoId}/comments/${commentId}/replays`).valueChanges().pipe(
      debounceTime(200),
      map(docArr => {

        return docArr.map(doc => {

          return {
            ...doc,
            publishedDate: new Date((<any>doc.publishedDate).seconds * 1000)
          };

        });

      })
    ).subscribe(replays => {

      this.replays$.next(replays);

    }));

  }

  /**
   *Get replay owner data
   *
   * @param {string} userId
   * @memberof PhotoService
   *
   * push new [ownerData] to `replaysOwnersData`
   *
   * @emits `replaysOwners$` with `replaysOwnersData[]`
   */
  getReplayOwnerData(userId: string) {

    this.subscriptions.push(this.getUserData(userId).subscribe(ownerData => {

      this.replaysOwnersData.push(ownerData);
      this.replaysOwners$.next(this.replaysOwnersData);

    }));

  }

  /**
   *Delete specific replay from db
   *
   * @param {string} photoId photo doc id
   * @param {string} commentId comment doc id
   * @param {string} replayId replay doc id
   * @memberof PhotoService
   */
  deleteReplay(photoId: string, commentId: string, replayId: string) {
    this.db.doc(`photos/${photoId}/comments/${commentId}/replays/${replayId}`).delete();
  }

  /**
   *Get specific user data from db
   *
   * @private
   * @param {string} userId user doc id
   * @returns {Observable<CommentOwnerData>}
   * @memberof PhotoService
   */
  private getUserData(userId: string): Observable<CommentOwnerData> {

    return this.db.doc(`users/${userId}`).get().pipe(
      debounceTime(200),
      map(snapshot => {

        return {
          userId: userId,
          userPhoto: snapshot.data().userPhoto as string,
          userName: snapshot.data().userName as string
        } as CommentOwnerData;

      })
    );

  }

  cancelSubscription() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
