import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentChangeAction } from '@angular/fire/firestore';
import { Subject, Subscription, BehaviorSubject } from 'rxjs';
import { debounceTime, map, catchError } from 'rxjs/operators';

import { Photo } from '../models/photo.model';
import { UiService } from './ui.service';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  /**
   *Holds photos that result of search from `db`
   *
   * @type {Subject<Photo[]>}
   * @memberof SearchService
   */
  searchResults: Subject<Photo[]> = new Subject();
  /**
   *Holds all the subscription of the service
   *
   * @private
   * @type {Subscription[]}
   * @memberof SearchService
   */
  private searchSupscriptions: Subscription[] = [];
  /**
   *To tell if loading skeleton should enable or disable
   *
   * @type {BehaviorSubject<boolean>}
   * @memberof SearchService
   */
  loadingSkeleton: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private db: AngularFirestore,
    private uiService: UiService
  ) { }

  /**
   *Get photos that in it's keywords array includes the search keyword
   *
   * @param {string} keyword the keyword for search
   * @memberof SearchService
   *
   * @method `cancelSubscription` to cancel all the service subscriptions
   * @emits true to `loadingState` to start loading
   *
   * search in `db` about keyword in keywords array
   *
   * use `debounceTime` to keep tracking this request the `map` the payload of the docs
   *
   * @param {Photo[]} result is the photos array that filtered by the keyword
   * @emits false to the `loadingState` to stop laoding
   * @emits result to the `searchResults`
   *
   * if error stop loading, show error message and emit `null` to `searchResults`
   */
  getPhotosByKeyword(keyword: string) {

    this.cancelSubscription();

    // this.uiService.loadingState.next(true);
    this.loadingSkeleton.next(true);

    this.searchSupscriptions.push(this.db.collection(`photos`, ref => ref.where('keywords', 'array-contains', keyword))
      .snapshotChanges().pipe(
        debounceTime(200),
        map((docsPayloadArr: DocumentChangeAction<{}>[]) => {

          return docsPayloadArr.map((docPayload: DocumentChangeAction<{}>) => {

            return docPayload.payload.doc.data();

          });

        }),
        catchError(err => {

          throw err;

        })
      ).subscribe(
        (result: Photo[]) => {

          // this.uiService.loadingState.next(false);
          this.loadingSkeleton.next(false);
          this.searchResults.next(result);

        },
        error => {

          // this.uiService.loadingState.next(false);
          this.loadingSkeleton.next(false);
          this.uiService.respondMessage(error.message);
          this.searchResults.next([]);

        }
      )
    );

  }

  cancelSubscription() {
    this.searchSupscriptions.forEach(sub => sub.unsubscribe());
  }
}
