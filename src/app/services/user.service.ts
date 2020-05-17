import { Injectable } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage, AngularFireUploadTask, AngularFireStorageReference } from '@angular/fire/storage';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { auth } from 'firebase/app';
import { Subject, Observable, Subscription } from 'rxjs';
import { map, first, finalize, catchError, debounceTime } from 'rxjs/operators';

import { User } from '../models/user.model';
import { UiService } from './ui.service';
import { ReauthenticateDialogComponent } from '../shared/reauthenticate-dialog/reauthenticate-dialog.component';
import { Notification } from '../models/notification.model';
import { FollowersFriends } from '../models/followers-friends.model';
import { GeneralData } from '../models/user.model';
import { Photo } from '../models/photo.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  /**
     *Holds user account settings
     *
     * @type {Subject<User>}
     * @memberof UserService
     */
  accountSettings$: Subject<User> = new Subject();

  /**
   *Uploading percentage for upload user photo
   *
   * @type {Observable<number>}
   * @memberof UserService
   */
  percentage$: Observable<number>;

  /**
   *Holds the user notifications
   *
   * @type {Subject<Notification[]>}
   * @memberof UserService
   */
  notifications$: Subject<Notification[]> = new Subject();

  /**
   *Array of subscriptions
   *
   * @private
   * @type {Subscription[]}
   * @memberof UserService
   */
  private subscriptions: Subscription[] = [];

  /**
   *User id
   *
   * @private
   * @type {string}
   * @memberof UserService
   */
  private userUid: string;

  /**
   *User photo path in storage
   *
   * @private
   * @type {string}
   * @memberof UserService
   */
  private userPhotoPath: string;

  /**
   *Holds all user photos from [photos] and [collections] collections in db
   *
   * @private
   * @type {Photo[]}
   * @memberof PhotoService
   */
  private userPhotos: Photo[] = [];

  /**
   *Holds all user photos
   *
   * @type {Subject<Photo[]>}
   * @memberof PhotoService
   */
  userPhotos$: Subject<Photo[]> = new Subject();

  /**
   *Holds all friends data from [friends] in db
   *
   * @private
   * @type {FollowersFriends[]}
   * @memberof UserService
   */
  private friendsList: FollowersFriends[] = [];

  /**
   *Emit fro all friends list
   *
   * @type {Subject<FollowersFriends[]>}
   * @memberof UserService
   */
  friends$: Subject<FollowersFriends[]> = new Subject();

  /**
   *Holds all home feeds
   *
   * @private
   * @type {Photo[]}
   * @memberof UserService
   */
  // private homeFeedsNew: Photo[] = [];

  /**
   *Emit user home page feeds
   *
   * @type {Subject<Photo[]>}
   * @memberof UserService
   */
  homeFeedsNew$: Subject<Photo[]> = new Subject();

  // private homeFeedsOld: Photo[] = [];
  homeFeedsOld$: Subject<Photo[]> = new Subject();

  /**
   *Creates an instance of UserService.
   * @param {AngularFireAuth} afAuth `fireauth authentication`
   * @param {AngularFirestore} db `firestore database`
   * @param {UiService} uiService
   * @param {MatDialog} dialog refrence to reauthentication dialog
   * @param {AngularFireStorage} storage `firestorage storage`
   * @memberof UserService
   */
  constructor(
    private afAuth: AngularFireAuth,
    private db: AngularFirestore,
    private uiService: UiService,
    private dialog: MatDialog,
    private storage: AngularFireStorage,
    private breakpointService: BreakpointObserver
  ) {

    this.afAuth.authState.subscribe(user => {

      if (user) {
        this.userUid = user.uid;
      }

    });

  }

  /**
   *Fetch user account settings from database
   * @param {boolean} loadingState to show or disable the loading bar
   * @param {string} userId user id to get user doc
   * @memberof UserService
   *
   * listen to value changes from collection path live's in database
   *
   * take the first data emits using `first()`
   *
   * mutate the data recived by `map()` ... @param dataArr is the data array recived
   * @returns new merged object using (Object.assign({}, ....)) and (spread syntx ... )
   *
   * @param {User} settings the object holds account settings in the [dataArr]
   * @returns object with the user account settings that object will merge to the object using (assign, ...)
   *
   * @param {User} accountSettings user account settings object
   * @emits accountSettings$ the settings object
   *
   * if there's an error happened while subscribing show error message and set [accountSettings$] to null
   */
  getUserAccountSettings(loadingState = true, userId = this.userUid) {

    if (loadingState) {
      this.uiService.loadingState.next(true);
    } else {
      this.uiService.loadingState.next(false);
    }

    this.subscriptions.push(this.db.doc(`users/${userId}/accountSettings/settings`).valueChanges().pipe(
      debounceTime(200),
      first(),
      map((settings: User) => {

        return {
          ...settings,
          birthdate: new Date((<any>settings.birthdate).seconds * 1000),
        };

      })).subscribe(
        (accountSettings: User) => {

          this.uiService.loadingState.next(false);
          this.accountSettings$.next(accountSettings);
          this.userPhotoPath = accountSettings.userPhoto;

        }, error => {

          this.uiService.loadingState.next(false);
          this.uiService.respondMessage('Failed to fetch account data.');
          this.accountSettings$.next(null);

        }
      ));
  }

  /**
   *Get user general data
   *
   * @param {string} userId user doc id
   * @returns {Observable<GeneralData>}
   * @memberof UserService
   */
  getUserGeneralData(userId: string): Observable<GeneralData> {

    return this.db.doc<GeneralData>(`users/${userId}`).snapshotChanges().pipe(
      map(payload => {

        const data = payload.payload.data() as GeneralData;

        return {
          ...data,
          signoutTime: new Date((<any>data.signoutTime).seconds * 1000)
        };

      })
    );

  }

  /**
   *On update user settings
   *
   * @template T
   * @param {T} newSettings hold the new settings will override old's
   * @param {boolean} [showMessage=true] to show responding message or not
   * @memberof UserService
   * @var {Subscription} subscription
   * @emits true  value to `loadingState` ... start
   * @method `getUserAccountSettings()` to get user account settings and emits to `accountSettings$`
   *
   * user `combineLatest` to get the last value emitted by two observable inputs
   *
   * @method `getUserDocId()` get the collection from firebase
   *
   * `accountSettings$` for accountsettings
   *
   * use `map` to mutate the value emitted
   *
   * @returns factory with `accountSettings` and `docId`
   * @constant {string} accountSettingDocId is database document id
   * @var {string} userName the username for the user
   * @if true assign `userName` to new settings
   * @else false assign `userName` to settings from database
   *
   * add new data to database with `merge flag`
   *
   * @method `getUserAccountSettings()` excute it when success to refetch the user settings
   * @emits false to `loadingState` ... stop
   * @if true show friendly message to the user
   * @else false don't show messages by default is true
   * @emits flase to `loadingState` and show error message if there's error and settings failed to add to db
   */
  updateUserAccountSettings<T extends User | { [key: string]: string | {} }>(newSettings: T, showMessage: boolean = true) {

    let subscription: Subscription;
    this.uiService.loadingState.next(true);
    this.getUserAccountSettings();

    subscription = this.accountSettings$.subscribe(result => {

      let userName: string;

      if (newSettings.firstName || newSettings.lastName) {

        userName = `${newSettings.firstName} ${newSettings.lastName}`;

      } else {

        userName = `${result.firstName} ${result.lastName}`;

      }

      this.db.doc(`users/${this.userUid}/accountSettings/settings`)
        .set({
          ...newSettings,
          userName: userName
        }, { merge: true })
        .then(() => {

          this.getUserAccountSettings();
          this.uiService.loadingState.next(false);

          if (showMessage) {
            this.uiService.respondMessage('Settings updated successfully.');
          }

          subscription.unsubscribe();

        })
        .catch(error => {

          this.uiService.loadingState.next(false);
          this.uiService.respondMessage(error.message);
          subscription.unsubscribe();

        });

    }, error => {

      this.uiService.loadingState.next(false);
      this.uiService.respondMessage('Something went wrong! please try again.');
      subscription.unsubscribe();

    });

  }

  /**
   *On update user email
   *
   * @param {string} newEmail the new email to replace the old one
   * @memberof UserService
   * @if true
   * @emits true to `loadingState` ... start
   * @constant {User} user  the signed in user
   * @method updateUserAccountSettings() override old email with new one in db
   * @emits true to `loadingState` ... stop and show message
   * @emits false to `loadingState` ... stop and show error message when failed
   */
  updateEmail(newEmail: string) {

    this.openReauthenticateDialog().afterClosed().subscribe((password: string) => {

      if (password) {

        this.uiService.loadingState.next(true);   // Start loading

        const user: firebase.User = this.afAuth.auth.currentUser;
        const credentials = auth.EmailAuthProvider.credential(user.email, password);

        user.reauthenticateWithCredential(credentials).then(() => {

          user.updateEmail(newEmail).then(() => {

            this.updateUserAccountSettings({ email: newEmail }, false);
            this.uiService.loadingState.next(false);  // stop loading
            this.uiService.respondMessage('Email updated successfully.');

          }).catch(() => {

            this.uiService.loadingState.next(false);  // stop loading
            this.uiService.respondMessage('Something went wrong! please try again');

          });

        }).catch(error => {

          this.uiService.loadingState.next(false);
          this.uiService.respondMessage(error.message);

        });

      }

    });

  }

  /**
   *On update user password
   *
   * @param {string} newPassword the new email to replace the old one
   * @memberof UserService
   * @if true
   * @emits true to `loadingState` ... start
   * @constant {User} user the signed in user
   *
   * succeeded - sign the user out
   *
   * @emits false to `loadingState` ... stop and show message
   */
  updatePassword(newPassword: string) {

    this.openReauthenticateDialog().afterClosed().subscribe((password: string) => {

      if (password) {

        this.uiService.loadingState.next(true);

        const user: firebase.User = this.afAuth.auth.currentUser;
        const credentials = auth.EmailAuthProvider.credential(user.email, password);

        user.reauthenticateWithCredential(credentials).then(() => {

          user.updatePassword(newPassword).then(() => {

            this.uiService.loadingState.next(false);
            this.uiService.respondMessage('Password updated successfully.');
            this.afAuth.auth.signOut();

          }).catch(error => {

            this.uiService.loadingState.next(false);
            this.uiService.respondMessage(error.message);

          });

        }).catch(error => {

          this.uiService.loadingState.next(false);
          this.uiService.respondMessage(error.message);

        });

      }

    });

  }

  private breakpointIsMatched(breakpoint: string, prefix = 'max'): boolean {
    return this.breakpointService.isMatched(`(${prefix}-width: ${breakpoint})`);
  }

  /**
   *Open reauthenticated dialog for user required for (password, email, delete)
   *
   * @private
   * @returns {MatDialogRef<ReauthenticateDialogComponent>}
   * @memberof UserService
   */
  private openReauthenticateDialog(): MatDialogRef<ReauthenticateDialogComponent> {

    const dialogRef = this.dialog.open(ReauthenticateDialogComponent, {
      backdropClass: 'backdrop',
      closeOnNavigation: true,
      autoFocus: false
    });

    if (this.breakpointIsMatched('480px')) {
      dialogRef.updateSize('76vw');
    } else if (this.breakpointIsMatched('768px')) {
      dialogRef.updateSize('66vw');
    } else if (this.breakpointIsMatched('992px')) {
      dialogRef.updateSize('56vw');
    } else if (this.breakpointIsMatched('1200px')) {
      dialogRef.updateSize('46vw');
    } else if (this.breakpointIsMatched('1201px', 'min')) {
      dialogRef.updateSize('560px');
    }

    return dialogRef;

  }

  /**
   *Update user profile photo / user photo
   *
   * @param {File} file the file intend to upload
   * @memberof UserService
   * @emits true to `loadingState` ... start
   * @constant {string} path is the location path of the file in storage
   * @constant {AngularFireStorageReference} storageRef the reference path of the storage
   * @if true (indeed photo less than 1Mb) upload the file
   * @constant {AngularFireUploadTask} task is the upload task
   *
   * set `percentage$` hold the percentage of the upload progress
   *
   * snapshotChanges() to get the file download url after uploaded successful
   *
   * @constant {string} downloadUrl the file download url
   *
   * get the download url of the 'default-user.png' from storage and turn it to promise
   *
   * @if false `userPhotoPath` doesn't includes the url of the 'default-user.png'
   * @constant {firebase.storage.reference} photoRef reference of the old user photo in storage
   *
   * delete the old user photo
   *
   * update the account settings to set the new url of new user photo in database
   *
   * @emits false to `loadingState` ... stop and show friendly message to the user
   *
   * if there's any error during retrive download url of the photo handel the error by `catchError`
   *
   * subscribe to excute
   *
   * @else false
   * @emits false to `loadingState` ... stop and show friendly message
   */
  async updateUserPhoto(file: File) {

    this.uiService.dialogLoadingState.next(true);

    const photoName = file.name;
    const photoSize = file.size;
    const photoType = file.type;


    const path = `users/${this.userUid}/userPhoto/${photoName}`;
    const storageRef: AngularFireStorageReference = this.storage.ref(path);


    const bytesToKilobytes = photoSize / 1000;

    if (bytesToKilobytes <= 1000) {

      const task: AngularFireUploadTask = this.storage.upload(path, file, { contentType: photoType });

      this.percentage$ = task.percentageChanges();

      task.snapshotChanges().pipe(

        finalize(async () => {

          const downloadUrl = await storageRef.getDownloadURL().toPromise();

          // `getUserAccountSettings` called to set `userPhotoPath` to the user photo in storage
          this.getUserAccountSettings();

          // to delete/empty the storage form older user default photo
          await this.storage.ref('default-user.png').getDownloadURL().toPromise().then(async url => {
            if (!this.userPhotoPath.includes(url)) {

              const photoRef = this.storage.storage.refFromURL(this.userPhotoPath);
              await photoRef.delete();

            }
          });

          await this.updateUserAccountSettings({
            userPhoto: downloadUrl,
            userPhotoStoragePath: path
          }, false);

          this.uiService.dialogLoadingState.next(false);
          this.uiService.respondMessage('Profile photo updated successfully.');

        }),
        catchError(err => {

          this.uiService.dialogLoadingState.next(false);
          this.uiService.respondMessage(err.message);
          throw err.message;

        })
      ).subscribe();
    } else {

      this.uiService.dialogLoadingState.next(false);
      this.uiService.respondMessage('Max size of the photo is 1Mb.');

    }

  }

  /**
   *Get user firends 'people who follow' from db
   *
   * @returns {Observable<any>}
   * @memberof UserService
   *
   * start loading
   *
   * use `debounceTime` to keep tracking the get request
   */
  getFriendsIds(loadingState = true): Observable<string[]> | undefined {

    if (loadingState) {
      this.uiService.loadingState.next(true);
    } else {
      this.uiService.loadingState.next(false);
    }

    return this.db.doc(`users/${this.userUid}/friends/friends`).snapshotChanges().pipe(
      debounceTime(200),
      map(payload => {
        if (payload.payload.exists) {
          return (<string[]>(<any>payload.payload.data()).friendsIds);
        } else {
          return [];
        }
      })
    );

  }

  /**
   *On get friend data
   *
   * @param {string} userId UID of the user intended to pull his data
   * @memberof UserService
   *
   * use `map` to mutate the data to `FollowersFriends` object data
   *
   * subscribe and push new [userData] to `friendsList` and emit it to `friends$`
   */
  getFriendData(userId: string) {

    let subscription: Subscription;

    subscription = this.db.doc(`users/${userId}`).snapshotChanges().pipe(
      debounceTime(200),
      map(payload => {

        return {
          userId: userId,
          userName: (<any>payload.payload.data()).userName as string,
          userPhoto: (<any>payload.payload.data()).userPhoto as string
        };

      })
    ).subscribe((userData: FollowersFriends) => {

      this.friendsList.push(userData);
      this.friends$.next(this.friendsList);
      subscription.unsubscribe();

    });

  }

  /**
   *Get friend by his id
   *
   * @param {string} uid user id
   * @returns {Observable<FollowersFriends>} observable
   * @memberof UserService
   *
   * use `map` and get the `uid` from the `friendsIds[]`
   */
  getFriendById(uid: string): Observable<string> {

    return this.db.doc(`users/${this.userUid}/friends/friends`)
      .valueChanges().pipe(
        debounceTime(200),
        map(docData => docData ? (<string[]>(<any>docData).friendsIds).find(ids => ids === uid) : null)
      );

  }

  /**
   *Get current user followers
   *
   * @returns {Observable<{ exist: boolean, data: FirebaseFirestore.DocumentData }>}
   * @memberof UserService
   */
  getFollowers(): Observable<{ exist: boolean, data: any }> {

    return this.db.doc(`users/${this.userUid}/followers/followers`).get().pipe(
      map(snapshot => {

        return {
          exist: snapshot.exists,
          data: snapshot.data()
        };

      })
    );

  }

  /**
   *On delete follower
   *
   * @param {string} friendId friend uid
   * @memberof UserService
   *
   * @constant {subscription} friendsSubscription
   *
   * Get `friendsIds[]` from db then remove `friendId` and send `friendsIds[]` again to db
   *
   * @constant {subscription} followersSubscription
   *
   * Get `followerIds[]` from db then remove `userUid` (current user) and send `followersIds[]` again to db
   */
  onDeleteFriendAndFollower(friendId: string) {

    let friendsSubscription: Subscription;

    friendsSubscription = this.db.doc(`users/${this.userUid}/friends/friends`).get().pipe(
      map(snapshot => snapshot.data().friendsIds)
    ).subscribe(
      (friendsIds: string[]) => {

        friendsIds.splice(friendsIds.indexOf(friendId), 1);

        this.db.doc(`users/${this.userUid}/friends/friends`).set({ friendsIds: friendsIds }, { merge: true })
          .then(() => friendsSubscription.unsubscribe())
          .catch(() => friendsSubscription.unsubscribe())
          .finally(() => {

            this.deleteAllFriendFeeds(friendId);
            this.removeNotExistFeeds();

          });

      }
    );

    let followersSubscription: Subscription;

    followersSubscription = this.db.doc(`users/${friendId}/followers/followers`).get().pipe(
      map(snapshot => snapshot.data().followersIds)
    ).subscribe(
      (followersIds: string[]) => {

        followersIds.splice(followersIds.indexOf(this.userUid), 1);

        this.db.doc(`users/${friendId}/followers/followers`).set({ followersIds: followersIds }, { merge: true })
          .then(() => followersSubscription.unsubscribe())
          .catch(() => followersSubscription.unsubscribe());

      }
    );
  }

  /**
   *Add new friend to the current user friends and add new follower to this friend followers
   *
   * @param {string} userId friend UID
   * @memberof UserService
   *
   * Get the friends of the current user
   *
   * @constant {subscription} friendsSubscription
   *
   * @if true -- get the `friendsIds` and push `userId` to it then send to database and unsubscribe
   * @if false -- send array with `userId` to db
   *
   * @constant {subscription} followersSubscription
   *
   * Get the followers of the friend
   *
   * @if true -- get the `followersIds` and push `userUid` to it then send to database and unsubscribe
   * @if false -- send array with `userUid` to db
   */
  onAddFriendAndFollower(userId: string) {

    let friendsSubscription: Subscription;

    friendsSubscription = this.db.doc(`users/${this.userUid}/friends/friends`)
      .get()
      .subscribe(snapshot => {

        if (snapshot.exists) {

          const friendsIds = snapshot.data().friendsIds;

          friendsIds.push(userId);

          this.db.doc(`users/${this.userUid}/friends/friends`)
            .set({ friendsIds: friendsIds }, { merge: true })
            .then(() => friendsSubscription.unsubscribe())
            .catch(() => friendsSubscription.unsubscribe())
            .finally(() => this.collectionHomeFeeds());

        } else {

          this.db.doc(`users/${this.userUid}/friends/friends`)
            .set({ friendsIds: [].concat(userId) }, { merge: true })
            .then(() => friendsSubscription.unsubscribe())
            .catch(() => friendsSubscription.unsubscribe())
            .finally(() => this.collectionHomeFeeds());

        }

      });

    let followersSubscription: Subscription;

    followersSubscription = this.db.doc(`users/${userId}/followers/followers`)
      .get()
      .subscribe(snapshot => {

        if (snapshot.exists) {

          const followersIds = snapshot.data().followersIds;

          followersIds.push(this.userUid);

          this.db.doc(`users/${userId}/followers/followers`)
            .set({ followersIds: followersIds }, { merge: true })
            .then(() => followersSubscription.unsubscribe())
            .catch(() => followersSubscription.unsubscribe());

        } else {

          this.db.doc(`users/${userId}/followers/followers`)
            .set({ followersIds: [].concat(this.userUid) })
            .then(() => followersSubscription.unsubscribe())
            .catch(() => followersSubscription.unsubscribe());

        }

      });
  }

  /**
   *Get user notifications
   *
   * @memberof UserService
   * @emits true to start loading
   *
   * get the data from db `ordered` by `date`
   *
   * use `debounceTime` to keep tracking the get request
   *
   * map the data change it then output as observable
   *
   * @emits notifications to `notifications$` and stop loading
   * @emits false to stop loading - show error message
   * @emits null to `notifiations$`
   */
  getNotifications() {

    this.uiService.loadingState.next(true);

    this.subscriptions.push(this.db.collection(`users/${this.userUid}/notifications`, ref => ref
      .orderBy('date'))
      .valueChanges()
      .pipe(
        debounceTime(200),
        map((notificationDocs: any[]) => {

          return notificationDocs.map((notifyDoc: Notification) => {

            return {
              id: notifyDoc.id,
              date: new Date((<any>notifyDoc).date.seconds * 1000),
              notificationText: notifyDoc.notificationText,
              owner: {
                userName: notifyDoc.owner.userName,
                profilePhoto: notifyDoc.owner.profilePhoto
              },
              link: notifyDoc.link
            };

          });

        })
      ).subscribe(
        (notifications: Notification[]) => {

          this.notifications$.next(notifications);
          this.uiService.loadingState.next(false);

        },
        error => {

          this.uiService.loadingState.next(false);
          this.uiService.respondMessage(error.message);
          this.notifications$.next(null);

        }
      ));
  }

  /**
   *Get user photos
   *
   * @param {string} userId user id
   * @memberof UserService
   * @emits true to loading state to start loading
   * @emits false to loading state to stop loading
   * @emits `userPhotos` array holds all user photos to `userPhotos$`
   *
   * clear `userPhotos`
   */
  getUserPhotos(userId: string) {

    this.uiService.loadingState.next(true);

    this.subscriptions.push(this.db.collection<Photo>('photos', ref => ref
      .where('owner.id', '==', `${userId}`))
      .snapshotChanges()
      .pipe(
        map(docArr => {

          return docArr.map(doc => doc.payload.doc.data());

        })
      ).subscribe(photos => {

        this.uiService.loadingState.next(false);
        this.userPhotos.push(...photos);
        this.userPhotos$.next(this.userPhotos);
        this.userPhotos = [];

      }));

  }

  /**
   *On Delete user account
   * @constant {firebase.User} user is the user access token
   * @constant {auth.AuthCredential} credentials user credentials email and password
   *
   * reauthenticate the user by his credentials
   *
   * delete user account then if succeded show [respondMessage] tell user that
   *
   * if operation field show the error message
   */
  deleteAccount() {

    this.openReauthenticateDialog().afterClosed().subscribe(password => {

      if (password) {

        this.uiService.loadingState.next(true);

        const user = this.afAuth.auth.currentUser;
        const credentials = auth.EmailAuthProvider.credential(user.email, password);

        user.reauthenticateWithCredential(credentials)
          .then(async credential => {
            user.delete().then(() => {

              this.uiService.loadingState.next(false);
              this.uiService.respondMessage('Account deleted Successfully.');

            }).catch(error => {

              this.uiService.loadingState.next(false);
              this.uiService.respondMessage(error.message);

            });

          })
          .catch(error => {

            this.uiService.loadingState.next(false);
            this.uiService.respondMessage(error.message);

          });

      }

    });

  }

  /**
   *Get user data for user menu
   *
   * @returns {Observable<any>}
   * @memberof UserService
   */
  getUserDataForMenu(): Observable<any> {

    return this.db.doc(`users/${this.userUid}/accountSettings/settings`).valueChanges().pipe(
      debounceTime(200)
    );

  }

  /**
   *User home page feeds
   *
   * @memberof UserService
   * @constant {Date} currentTime is the now time to compare with feeds
   * @constant {Promise} getFriendsIds get user friends doc
   *
   * get friends ids array and loop over it and get photos for every user
   * then for every document (photo) add it to "user feeds path" in database
   */
  collectionHomeFeeds(): Promise<any> {

    const currentTime: Date = new Date();
    const getFriendsIds = this.db.doc(`users/${this.userUid}/friends/friends`).get().toPromise();

    return getFriendsIds
      .then(snapshot => {

        return snapshot.data().friendsIds as string[];

      })
      .then(friendsIds => {

        friendsIds.forEach(id => {

          const filterPhotos = this.db.collection<Photo>('photos', ref => ref
            .where('owner.id', '==', `${id}`)
            .where('publishedDate', '<=', currentTime)
            .orderBy('publishedDate', 'desc'))
            .get().toPromise();

          filterPhotos
            .then(photosDocs => {

              photosDocs.forEach(doc => {

                const docId = doc.data().id as string;

                this.db.doc(`users/${this.userUid}/feeds/${docId}`).set({ ...doc.data() as Photo }, { merge: true })
                  .then(() => {

                    const getLikes = this.db.doc(`photos/${docId}/likes/likes`).get().toPromise();

                    getLikes.then(snap => {

                      if (snap.exists) {

                        const likes: string[] = snap.data().likes;

                        if (likes.includes(this.userUid)) {

                          this.db.doc(`users/${this.userUid}/feeds/${docId}`)
                            .set({ isUserLikePhoto: true }, { merge: true });

                        } else {

                          this.db.doc(`users/${this.userUid}/feeds/${docId}`)
                            .set({ isUserLikePhoto: false }, { merge: true });

                        }

                      }

                    });

                  });

              });

            });

        });

      })
      .catch(() => {

        this.collectionHomeFeeds();

      });

  }

  // this functionality been handeled in (pagination service) //
  /**
   *Get user home feeds
   *
   * @returns {Observable<Photo[]>} array of photos as feeds
   * @memberof UserService
   * @constant {AngularFirestoreCollection<Photo>} getFeeds get collection with 'desc' order from db
   *
   * observe the changes on the collection, mutate the data and return the observable
   */
  // getHomeFeeds(): Observable<Photo[]> {
  //   const getFeeds = this.db.collection<Photo>(`users/${this.userUid}/feeds`, ref => ref
  //     .orderBy('publishedDate', 'desc'));

  //   return getFeeds.valueChanges().pipe(
  //     map(docs => {
  //       return docs.map(photo => {
  //         return {
  //           ...photo,
  //           publishedDate: new Date((<any>photo.publishedDate).seconds * 1000)
  //         } as Photo;
  //       });
  //     })
  //   );
  // }

  /**
   *Check and remove all unneccessary documents
   *
   * @memberof UserService
   * @constant {AngularFirestoreCollection<Photo>} getFeeds user feeds from db
   *
   * check if there's a document in (feeds path) in db not exist in (photo path) in db, delete it
   */
  removeNotExistFeeds() {

    const getFeeds = this.db.collection(`users/${this.userUid}/feeds`).get().toPromise();

    getFeeds
      .then(snapshot => {

        snapshot.forEach(doc => {

          const docId: string = doc.data().id;

          this.db.doc<Photo>(`photos/${docId}`).get().toPromise()
            .then(snap => {

              if (!snap.exists) {
                this.db.doc(`users/${this.userUid}/feeds/${docId}`).delete();
              }

            });

        });

      });

  }

  private deleteAllFriendFeeds(friendId: string): Promise<void> {

    const getFeeds = this.db.collection(`users/${this.userUid}/feeds`, ref => ref
      .where('owner.id', '==', friendId))
      .get()
      .toPromise();

    return getFeeds
      .then(snapshot => {

        snapshot.forEach(doc => {
          doc.ref.delete();
        });

      });

  }

  // unsbuscribe for the all subscriptions in the [this.subscriptions]
  cancelSubscription() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.friendsList = [];
  }
}
