import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subscription, Subject, Observable } from 'rxjs';
import { map, debounceTime, take } from 'rxjs/operators';

import { Collection } from '../models/collection.model';
import { UiService } from './ui.service';
import { Photo } from '../models/photo.model';

interface CollectionUpdate {
  title: string;
  keywords: string[];
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  /**
   *Holds all user collections
   *
   * @type {Subject<Collection[]>} array of collection
   * @memberof CollectionService
   */
  collections$: Subject<Collection[]> = new Subject();

  /**
   *Holds all photos in collection
   *
   * @private
   * @type {Photo[]}
   * @memberof CollectionService
   */
  private collectionPhotos: Photo[] = [];

  /**
   *Observable that holds all photos in collection
   *
   * @type {Subject<Photo[]>}
   * @memberof CollectionService
   */
  collectionPhotos$: Subject<Photo[]> = new Subject();

  /**
   *Subscription array of the service
   *
   * @private
   * @type {Subscription[]}
   * @memberof CollectionService
   */
  private subscriptions: Subscription[] = [];
  private readonly collectionTitle = `${new Date().getDay()}/${new Date().getMonth()}/${new Date().getFullYear()}`;

  constructor(
    private db: AngularFirestore,
    private afAuth: AngularFireAuth,
    private uiService: UiService
  ) { }

  /**
   *On add new collection
   *
   * @param {string} title collection title is optional if provided use new value if not use default one
   * @constant {string} docId is doc id
   * @constant {string} userId is the current user id
   * @memberof CollectionService
   *
   * add new collection to db then show friendly msg on successful or failure
   */
  addNewCollection(title = this.collectionTitle) {

    const docId = this.db.createId();
    const userId = this.afAuth.auth.currentUser.uid;

    this.db.doc<Collection>(`galleries/${docId}`).set({
      id: docId,
      title: title,
      owner: {
        id: userId
      },
      photos: [],
      description: '',
      cover: {
        id: '',
        thumUrl: '',
        originalUrl: ''
      },
      keywords: [],
      privacy: 'public',
      publishedDate: new Date(),
      roles: {
        [userId]: 'owner'
      }
    }, { merge: true })
      .then(() => {

        this.uiService.respondMessage('Collection created successfully');

      })
      .catch(error => {

        this.uiService.respondMessage(error.message);

      });

  }

  /**
   *Get user collection
   *
   * @param {string} userId user id
   * @memberof CollectionService
   *
   * use `map` to mutate the data collection and change the `publishedDate`
   *
   * @emits false to `loadingState`
   * @emits collections to `collections$`
   */
  getUserCollections(userId: string, loading = 'standard') {

    switch (loading) {
      case 'standard':
        this.uiService.loadingState.next(true);
        break;
      case 'dialog':
        this.uiService.dialogLoadingState.next(true);
        break;
      default:
        this.uiService.loadingState.next(false);
        this.uiService.dialogLoadingState.next(false);
        break;
    }

    this.subscriptions.push(this.db.collection<Collection>('galleries', ref => ref
      .where('owner.id', '==', `${userId}`))
      .valueChanges()
      .pipe(
        debounceTime(200),
        map(collections => {

          return collections.map(collection => {

            return {
              ...collection,
              publishedDate: new Date((<any>collection.publishedDate).seconds * 1000)
            };

          });

        })
      ).subscribe(collections => {

        switch (loading) {
          case 'standard':
            this.uiService.loadingState.next(false);
            break;
          case 'dialog':
            this.uiService.dialogLoadingState.next(false);
            break;
          default:
            this.uiService.loadingState.next(false);
            this.uiService.dialogLoadingState.next(false);
            break;
        }

        this.collections$.next(collections);

      }));

  }

  /**
   *Get collection by it's id
   *
   * @param {string} id collection id
   * @returns {Observable<Collection>}
   * @memberof CollectionService
   */
  getCollectionById(id: string): Observable<Collection> {

    this.uiService.loadingState.next(true);

    return this.db.doc<Collection>(`galleries/${id}`).valueChanges().pipe(
      map(collection => {

        return {
          ...collection,
          publishedDate: new Date((<any>collection.publishedDate).seconds * 1000)
        };

      })
    );

  }

  /**
   *On get photo
   *
   * @param {string} id photo id
   * @memberof CollectionService
   * @emits true to start loading
   *
   * empty `collectionPhotos[]` then get photo from db and mutate it's data
   *
   * add [photo] to `collectionPhotos` array
   *
   * @emits `collectionPhotos` in `collectionPhotos$`
   */
  getCollectionPhoto(id: string) {

    this.uiService.loadingState.next(true);
    this.collectionPhotos = [];

    let subscription: Subscription;
    subscription = this.db.doc(`photos/${id}`).get().pipe(
      take(1),
      map(snap => {

        const photo = snap.data() as Photo;

        if (snap.exists) {

          return {
            ...photo,
            publishedDate: new Date((<any>photo.publishedDate).seconds * 1000)
          } as Photo;

        }

        return;

      })
    ).subscribe(photo => {

      this.uiService.loadingState.next(false);
      this.collectionPhotos.push(photo);
      this.collectionPhotos$.next(this.collectionPhotos);
      subscription.unsubscribe();

    });

  }

  /**
   *On delete photo from collection
   *
   * @param {string} collectionId collection id that photo in it
   * @param {Photo} photo photo intended to delete
   * @memberof CollectionService
   * @emits true to start loading
   *
   * get collection from database and get `photos` array property from collection
   *
   * @param {string[]} photosIds ids of the photos in this collection
   * @constant photoDocId id of the photo intended to delete
   * @constant photoIdIdx the index of this [id] in `photos` property extracted form collection
   *
   * splice the id "delete it" form array then send new `photos` array to collection with flag `merge`
   */
  deletePhotoFromCollection(collectionId: string, photos: Photo[]): Promise<void> {

    this.uiService.loadingState.next(true);

    return this.db.doc<Collection>(`galleries/${collectionId}`).ref.get()
      .then(snap => {

        return snap.data().photos as string[];

      })
      .then(photosIds => {

        photos.forEach(photo => {

          const photoDocId = photosIds.find(pId => pId === photo.id);
          const photoIdIdx = photosIds.indexOf(photoDocId);
          photosIds.splice(photoIdIdx, 1);

        });

        return photosIds;

      })
      .then(photosIds => {

        return this.db.doc(`galleries/${collectionId}`)
          .set({ photos: photosIds }, { merge: true })
          .then(() => {

            this.uiService.loadingState.next(false);
            this.uiService.respondMessage('Photo(s) successfully deleted from collection');

          })
          .catch(() => this.deletePhotoFromCollection(collectionId, photos));
      });

  }

  /**
   *On update collection
   *
   * @param {string} collectionId collection id in db
   * @param {CollectionUpdate} newEdits edits going to occur in collection
   * @memberof CollectionService
   * @emits true to start loading
   *
   * send new edits to database then stop the loading and show firendly message
   */
  updateCollection(collectionId: string, newEdits: CollectionUpdate) {

    this.uiService.loadingState.next(true);

    this.db.doc(`galleries/${collectionId}`).set({ ...newEdits }, { merge: true })
      .then(() => {

        this.uiService.loadingState.next(false);
        this.uiService.respondMessage('Collection updated successfully');

      })
      .catch(error => {

        this.uiService.loadingState.next(false);
        this.uiService.respondMessage('Network connection lost! please try again');

      });

  }

  /**
   *On Add new photo to collection
   *
   * @param {string} collectionId collection id in database
   * @param {string} photoId photo id to add to collection
   * @memberof CollectionService
   * @emits true to start loading
   *
   * get the collection from database and extract `photo[]` property from collection
   *
   * if photo id not exist add it to [photosIds] then send it to database
   */
  addPhotoToCollection(collectionId: string, photoId: string) {

    this.uiService.loadingState.next(true);

    this.db.doc<Collection>(`galleries/${collectionId}`).get().toPromise()
      .then(snapshot => snapshot.data().photos as string[])
      .then(photosIds => {

        if (!photosIds.includes(photoId)) {

          photosIds.push(photoId);

          this.db.doc(`galleries/${collectionId}`).set({ photos: photosIds }, { merge: true })
            .then(() => {

              this.uiService.loadingState.next(false);
              this.uiService.respondMessage('Photo added successfully to your collection(s)');

            })
            .catch(error => {

              this.uiService.loadingState.next(false);
              this.uiService.respondMessage('Network connection lost! please try again');

            });

        }

      })
      .catch(error => {

        this.uiService.loadingState.next(false);
        this.uiService.respondMessage('Network connection lost! please try again');

      });

  }

  /**
   *On Add new photo to collection
   *
   * @param {string} collectionId collection id in database
   * @param {string} photoId photo id to add to collection
   * @memberof CollectionService
   * @emits true to start loading
   *
   * get the collection from database and extract `photo[]` property from collection
   *
   * if photo id exist remove it from [photosIds] then send it to database
   */
  removePhotoFromCollection(collectionId: string, photoId: string) {

    this.uiService.loadingState.next(true);

    this.db.doc<Collection>(`galleries/${collectionId}`).get().toPromise()
      .then(snapshot => snapshot.data().photos as string[])
      .then(photosIds => {

        if (photosIds.includes(photoId)) {

          const photoIdx = photosIds.findIndex(id => id === photoId);
          photosIds.splice(photoIdx, 1);

          this.db.doc(`galleries/${collectionId}`).set({ photos: photosIds }, { merge: true })
            .then(() => {

              this.uiService.loadingState.next(false);
              this.uiService.respondMessage('Photo deleted successfully from your collection(s)');

            })
            .catch(error => {

              this.uiService.loadingState.next(false);
              this.uiService.respondMessage('Network connection lost! please try again');

            });

        }

      })
      .catch(error => {

        this.uiService.loadingState.next(false);
        this.uiService.respondMessage('Network connection lost! please try again');

      });

  }

  /**
   *Delete collection by id
   *
   * @param {string} collectionId collection id
   * @returns {Promise<void>} message with success or fail the operation
   * @memberof CollectionService
   */
  deleteCollection(collectionId: string): Promise<void> {

    return this.db.doc(`galleries/${collectionId}`).delete()
      .then(() => this.uiService.respondMessage('Collection deleted successfully'))
      .catch(error => this.uiService.respondMessage('Network connection lost! please try again'));

  }

  // unsubscribe for all subscriptions
  cancelSubscriptions() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.collectionPhotos = [];
  }
}
