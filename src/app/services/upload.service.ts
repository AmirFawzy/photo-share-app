import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireStorage } from '@angular/fire/storage';
import { User } from 'firebase';
import { Subscription, Subject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { Photo } from '../models/photo.model';
import { UiService } from './ui.service';
import { CollectionService } from './collection.service';

interface PhotoDoc extends Photo {
  fakeId: string;
  storagePath: string;
}

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  /**
   *
   *
   * @private
   * @type {string}
   * @memberof UploadService
   */
  private userId: string;
  /**
   *Array of Subscriptions
   *
   * @private
   * @type {Subscription[]}
   * @memberof UploadService
   */
  private afSub: Subscription[] = [];
  /**
   *Photo files array fetched from db
   *
   * @type {Subject<Photo[]>}
   * @memberof UploadService
   */
  fetchedFiles$: Subject<Photo[]> = new Subject();

  /**
   *Creates an instance of UploadService.
   * @param {AngularFirestore} db `firestore database`
   * @param {AngularFireAuth} afAuth `fireauth authentication`
   * @param {UiService} uiService
   * @param {AngularFireStorage} storage `firestorage storage`
   * @memberof UploadService
   */
  constructor(
    private db: AngularFirestore,
    private afAuth: AngularFireAuth,
    private uiService: UiService,
    private storage: AngularFireStorage,
    private collectionService: CollectionService
  ) {
    this.afAuth.authState.subscribe((user: User) => {
      if (user) {
        this.userId = user.uid;
      }
    });
  }

  /**
   * get uploaded photos after upload operation is done
   * @memberof UploadService
   * @property {Subscription[]} afSub push new subscription to unsubscribe later
   *
   * observe value changes on db collection get the documents array from db path
   *
   * map data the recived documents array then map the array and return array of new objects
   *
   * handle the error if there's any and emit observable with error by using [catchError]
   *
   * @property {Subject<Photo[]>} fetchedFiles$ fetched photo files from db
   * @emits stop to dialog loading state if done
   * @emits stop and show error message if there's any error
   */
  getUploadedFilesFromFakePath() {

    this.uiService.dialogLoadingState.next(true);

    this.afSub.push(
      this.db.collection<Photo>(`uploadPlaceholder`, ref => ref.where(`roles.${this.userId}`, '==', 'owner'))
        .valueChanges().pipe(
          map(docArr => {

            return docArr.map((doc: PhotoDoc) => {

              return {
                id: doc.id,
                title: doc.title,
                photo: doc.photo,
                collections: doc.collections,
                thumbnails: doc.thumbnails,
                views: doc.views,
                likes: doc.likes,
                owner: {
                  id: doc.owner.id,
                  userName: doc.owner.userName,
                  profilePhoto: doc.owner.profilePhoto
                },
                description: doc.description,
                keywords: typeof doc.keywords === 'string' ? [] : doc.keywords,
                location: doc.location,
                locationDetails: doc.locationDetails,
                publishedDate: doc.publishedDate,
                isNodity: doc.isNodity,
                camera: doc.camera,
                tools: doc.tools,
                software: doc.software,
                roles: doc.roles
              } as Photo;

            });

          }),
          catchError(error => error)
        ).subscribe(
          (photos: Photo[]) => {

            this.fetchedFiles$.next(photos);
            this.uiService.dialogLoadingState.next(false);

          },
          error => {

            this.uiService.dialogLoadingState.next(false);
            this.uiService.respondMessage('Failed to fetch uploaded photos you will find them in your photos.');

          })
    );

  }

  /**
   * on edit photo update the document of this photo in db
   * @param {({ [key: string]: string | boolean | string[] })} photo new object will merge with the document in db
   * @memberof UploadService
   * @emits new value to [dialogLoadingState] to start loading
   *
   * set new object to the document in db
   * @emits new value to [dialogLoadingState] to stop loading
   *
   * there's error stop dialog loading and show error message
   */
  onUpdatePhoto(photo: { [key: string]: string | boolean | string[] }) {

    this.uiService.dialogLoadingState.next(true);

    return this.db.doc(`uploadPlaceholder/${photo.id}`)
      .set({ ...photo }, { merge: true })
      .then(() => {

        this.uiService.dialogLoadingState.next(false);

      })
      .catch(error => {

        this.uiService.dialogLoadingState.next(false);
        this.uiService.respondMessage(error.message);

      });

  }

  /**
   * on delete photo
   * @param {Photo} photo the photo object
   * @memberof UploadService
   *
   * delete this photo from storage and thumbnail
   *
   * delete the document of this photo from db
   */
  onDeletePhoto(photo: Photo) {

    this.storage.ref(photo.photo.storagePath).delete();
    this.storage.ref(photo.thumbnails.thum500.storagePath).delete();
    this.db.doc<Photo>(`uploadPlaceholder/${photo.id}`).delete();

  }

  /**
   *On submit uploaded photos
   *
   * @memberof UploadService
   * @param {string} collectionIdIfExist collection id - if the photo added to specific collection
   * @emits `true` to start loading
   *
   * map the data recived from db
   *
   * @constant thum500Ref thumbnail @500 storage path
   * @constant thum500DownloadUrl thumbnail @500 download url
   * @constant photoRef photo reference storage path
   * @constant photoDownloadUrl photo download url
   *
   * set new data with `merge flag` and add 'views' document
   *
   * @emits `false` wehn success to stop loading
   * @method `cancelSubscription()` to prevent memory leaks
   * @emits `false` when fail to stop loading, show error message, excute `cancelSubscription()`
   */
  onSubmitUploadedPhotos(collectionIdIfExist?: string) {

    this.uiService.loadingState.next(true);

    this.afSub.push(
      this.db.collection(`uploadPlaceholder`, ref => ref.where(`roles.${this.userId}`, '==', 'owner'))
        .valueChanges().pipe(
          map(docArr => {

            return docArr.forEach(async (photoDoc: Photo) => {

              const thum500Ref = this.storage.ref(photoDoc.thumbnails.thum500.storagePath);
              const thum500DownloadUrl = await thum500Ref.getDownloadURL().toPromise();
              const photoRef = this.storage.ref(photoDoc.photo.storagePath);
              const photoDownloadUrl = await photoRef.getDownloadURL().toPromise();

              await this.db.doc<Photo>(`photos/${photoDoc.id}`).set({
                id: photoDoc.id,
                title: photoDoc.title,
                photo: {
                  ...photoDoc.photo,
                  downloadUrl: photoDownloadUrl
                },
                collections: collectionIdIfExist ? [collectionIdIfExist] : photoDoc.collections,
                thumbnails: {
                  thum500: {
                    ...photoDoc.thumbnails.thum500,
                    downloadUrl: thum500DownloadUrl
                  }
                },
                views: photoDoc.views,
                likes: photoDoc.likes,
                owner: {
                  id: photoDoc.owner.id,
                  userName: photoDoc.owner.userName,
                  profilePhoto: photoDoc.owner.profilePhoto
                },
                description: photoDoc.description,
                keywords: photoDoc.keywords,
                location: photoDoc.location,
                locationDetails: photoDoc.locationDetails,
                publishedDate: photoDoc.publishedDate,
                isNodity: photoDoc.isNodity,
                camera: photoDoc.camera,
                tools: photoDoc.tools,
                software: photoDoc.software,
                roles: photoDoc.roles
              }, { merge: true })
                .then(() => {

                  this.db.doc(`photos/${photoDoc.id}/views/views`).set({ views: 0 });
                  this.db.doc(`photos/${photoDoc.id}/likes/likes`).set({ likes: [] });

                });

              if (photoDoc.collections.length) {

                await photoDoc.collections.forEach(async collectionId => {
                  await this.collectionService.addPhotoToCollection(collectionId, photoDoc.id);
                });

              }

              if (collectionIdIfExist) {
                await this.collectionService.addPhotoToCollection(collectionIdIfExist, photoDoc.id);
              }

              this.deleteUploadPlaceholderDocs(photoDoc.id);

            });
          }),
          catchError(error => error)
        ).subscribe(
          () => {

            this.uiService.loadingState.next(false);
            this.cancelSubscription();

          },
          error => {

            this.uiService.loadingState.next(false);
            this.uiService.respondMessage(error.message);
            this.cancelSubscription();

          }
        )
    );

  }

  /**
   *On close the dialog with out click on `submit` button
   *
   * @memberof UploadService
   * @emits true to start loading
   *
   * map the data recived from firebase collection
   *
   * @if true indeed there's a documents there delete `placeholder doc`, delete photo and thumbnail
   * from `storage` and delete photo from photos `collection` in db
   * @else false
   * @emits false to stop loading
   *
   ** handel errors by using `catchError`
   ** successful? stop loading, show message and excute `cancelSubscription()` prevent memory leaks
   ** failed? stop loading and excute `onUnsubmit()` again
   */
  onUnsubmit() {

    this.uiService.loadingState.next(true);

    this.afSub.push(this.db.collection(`uploadPlaceholder`, ref => ref.where(`roles.${this.userId}`, '==', 'owner'))
      .valueChanges().pipe(
        map(docArr => {

          return docArr.forEach(async (photoDoc: Photo) => {

            if (photoDoc) {

              if (photoDoc.collections.length) {

                await photoDoc.collections.forEach(async collectionId => {
                  await this.collectionService.removePhotoFromCollection(collectionId, photoDoc.id);
                });

              }

              this.db.doc<Photo>(`photos/${photoDoc.id}`).delete();
              this.deleteUploadPlaceholderDocs(photoDoc.id);
              this.storage.ref(photoDoc.photo.storagePath).delete();
              this.storage.ref(photoDoc.thumbnails.thum500.storagePath).delete();

            } else {

              this.uiService.loadingState.next(false);

            }

          });

        }),
        catchError(error => error)
      ).subscribe(
        () => {

          this.uiService.loadingState.next(false);
          this.uiService.respondMessage('Photo(s) unsubmitted.');
          this.cancelSubscription();

        },
        error => {

          this.uiService.loadingState.next(false);

        }
      ));
  }

  /**
   * @param {string} docId db document id
   * @returns {Promise<any>} delete the doc
   * @memberof UploadService
   */
  private deleteUploadPlaceholderDocs(docId: string): Promise<any> {
    return this.db.doc<Photo>(`uploadPlaceholder/${docId}`).delete();
  }

  // unsubscription method to unsubscribe all subscriptions in @this afSub <[]>
  cancelSubscription() {
    this.afSub.forEach(sub => sub.unsubscribe());
  }
}
