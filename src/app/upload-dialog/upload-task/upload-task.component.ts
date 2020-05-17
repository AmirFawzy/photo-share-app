import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { AngularFireUploadTask, AngularFireStorage } from '@angular/fire/storage';
import { UploadTaskSnapshot } from '@angular/fire/storage/interfaces';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { Observable, Subscription } from 'rxjs';
import { finalize, catchError } from 'rxjs/operators';

import { Photo } from '../../models/photo.model';
import { UiService } from '../../services/ui.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';

interface PhotoFile extends File {
  bolbLink: any;
  fakeId: string;
}

interface PhotoDoc extends Photo {
  fakeId: string;
}

@Component({
  selector: 'ps-upload-task',
  templateUrl: './upload-task.component.html',
  styleUrls: ['./upload-task.component.scss']
})
export class UploadTaskComponent implements OnInit, OnDestroy {
  @Input() file: PhotoFile;
  @Output() fakeId = new EventEmitter<string>();
  private ownerUserName: string;
  private ownerProfilePhoto: string;
  private snapSubscription: Subscription;
  private authSubscription: Subscription;
  task: AngularFireUploadTask;
  percaentage: Observable<number>;
  snapshot: Observable<UploadTaskSnapshot>;
  downloadUrl: string;
  snap: UploadTaskSnapshot;

  constructor(
    private storage: AngularFireStorage,
    private db: AngularFirestore,
    private afAuth: AngularFireAuth,
    private uiService: UiService,
    private userService: UserService
  ) {
    /**
     *Subscribe for `authState`
     *
     * @memberof AngularFireAuth authentication firebase service
     * @if true
     * @method `getUserAccountSettings` excute to get user data
     *
     * subscribe for `accountSettings$` and set value of `ownerUserName` and `ownerProfilePhoto`
     */
    this.authSubscription = this.afAuth.authState.subscribe(async user => {
      if (user) {
        await this.userService.getUserAccountSettings();
        this.userService.accountSettings$.subscribe(
          (userSettings: User) => {
            this.ownerUserName = userSettings.userName;
            this.ownerProfilePhoto = userSettings.userPhoto;
          }
        );
      }
    });
  }

  ngOnInit() {
    // excute the method when component finish init
    this.startUplaod();

    // subscribe for snapshot to handle errors
    this.snapSubscription = this.snapshot.subscribe(
      snap => this.snap = snap,
      error => {

        const errorCode = error.code;

        switch (errorCode) {
          case 'storage/retry-limit-exceeded':
            this.uiService.respondMessage('Max retry time for operation exceeded, please try again');
            break;
          case 'storage/canceled':
            this.uiService.respondMessage('Upload operation canceled');
            break;
          default: this.uiService.respondMessage(error.message);
                   break;
        }

        this.onCancel();

      }
    );
  }

  /**
   * @const userId <string> the signed user id
   * @const path <string> the file path in the storage
   * @const storageRef point to the ref of the file in the storage
   * @const thumbPath <string> the thumb path in the storage
   * @const fileName <string> extract the file name without file extension '.jpg, .png... ect'
   * @this task <AngularFireUploadTask> holds the upload task with the [path] and [file] intend to uplaod
   * @this percaentage <number> holds the upload progress .. how much already uploaded?
   * @this snapshot <UploadTaskSnapshot> holds the snapshot of the task
   *
   * use [finalize] to get the finished observable (file finish upload)
   *
   * wait until recieved [downloadURL] then add new data to the database
   *
   * with fake path (just place holder to hold only new photos uploaded)
   */
  startUplaod() {
    this.uiService.loadingState.next(false);

    const userId = this.afAuth.auth.currentUser.uid;
    const docId = this.db.createId();
    const filePath = `users/${userId}/photos/${docId}/${this.file.name}`;
    const storageRef = this.storage.ref(filePath);
    const thumbPath = `users/${userId}/photos/${docId}/thumb@500_${this.file.name}`;

    const fileName = this.file.name.substr(0, this.file.name.lastIndexOf('.')).split(' ').join('-');
    const photoExt = this.file.name.split('.').pop();

    this.task = this.storage.upload(filePath, this.file, { contentType: this.file.type });
    this.percaentage = this.task.percentageChanges();

    this.snapshot = this.task.snapshotChanges().pipe(
      finalize(async () => {

        this.downloadUrl = await storageRef.getDownloadURL().toPromise();
        this.uiService.dialogLoadingState.next(true);   // loading start

        await this.db.collection(`uploadPlaceholder`).doc<PhotoDoc>(docId).set({
          id: docId,
          fakeId: this.file.fakeId,
          photo: {
            storagePath: filePath,
            downloadUrl: this.downloadUrl,
            photoExt: photoExt
          },
          collections: [],
          title: fileName,
          owner: {
            id: userId,
            userName: this.ownerUserName,
            profilePhoto: this.ownerProfilePhoto
          },
          likes: 0,
          views: 0,
          description: '',
          keywords: [],
          location: '',
          locationDetails: '',
          isNodity: false,
          camera: { model: '' },
          tools: [],
          software: [],
          publishedDate: new Date(),
          roles: {
            [userId]: 'owner'
          },
          thumbnails: {
            thum500: {
              storagePath: thumbPath,
              downloadUrl: ''
            }
          }
        }, { merge: true })
          .catch(async error => {

            await storageRef.delete();

            this.uiService.dialogLoadingState.next(false);  // stop loading
            this.uiService.respondMessage(error.message);

          });

        this.fakeId.emit(this.file.fakeId);

      })
    ), catchError(error => error);
  }

  // is upload process still active or finished
  isActive(): boolean {
    return (this.snap.state === 'running') && (this.snap.bytesTransferred < this.snap.totalBytes);
  }

  /**
   * on cancel file uploading
   * the file from files arr in uploadDialogComponent
   * @this fakeId <string> emit the fake id of the file
   */
  onCancel() {
    this.task.cancel();
    this.fakeId.emit(this.file.fakeId);
  }

  ngOnDestroy() {
    this.snapSubscription.unsubscribe();
    this.authSubscription.unsubscribe();
    this.userService.cancelSubscription();
  }
}
