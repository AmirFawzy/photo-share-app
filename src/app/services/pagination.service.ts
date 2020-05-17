import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { scan, tap, take } from 'rxjs/operators';

interface QueryConfig {
  path: string;
  field: string;
  limit: number;
  reverse: boolean;
  prepend: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PaginationService {
  private done: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private loading: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private data: BehaviorSubject<any[]> = new BehaviorSubject([]);
  private query: QueryConfig;
  private subscription: Subscription = new Subscription();
  // isInitRequest$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  data$: Observable<any[]>;
  done$: Observable<boolean> = this.done.asObservable();
  loading$: Observable<boolean> = this.loading.asObservable();

  constructor(private db: AngularFirestore) { }

  /**
   * Initial query sets options and defines the Observable
   * passing opts will override the defaults
   *
   * @param {string} path path to collection in db
   * @param {string} field field to orderBy (property)
   * @param {({ [key: string]: string | number | boolean })} [opt]
   * @memberof PaginationService
   *
   * get the first request form db then update the data [mapAndUpdate()]
   * then `data$` create the observable array for consumption in components
   */
  init(path: string, field: string, opt?: { [key: string]: string | number | boolean }) {

    this.query = {
      path: path,
      field: field,
      limit: 2,
      reverse: true,
      prepend: false,
      ...opt
    };

    const firstGet = this.db.collection(this.query.path, ref => ref
      .orderBy(this.query.field, this.query.reverse ? 'desc' : 'asc')
      .limit(this.query.limit));

    // this.isInitRequest$.next(true);

    this.updateData(firstGet);

    this.data$ = this.data.asObservable().pipe(
      scan((acc, val) => {
        return this.query.prepend ? val.concat(acc) : acc.concat(val);
      })
    );

  }

  /**
   *Retrieves additional data from firestore
   *
   * @memberof PaginationService
   */
  more() {

    const cursor = this.getCursor();

    const more = this.db.collection(this.query.path, ref => ref
      .orderBy(this.query.field, this.query.reverse ? 'desc' : 'asc')
      .limit(this.query.limit)
      .startAfter(cursor));

    this.updateData(more);

  }

  /**
   *Determines the doc snapshot to paginate query from
   *
   * @private
   * @returns
   * @memberof PaginationService
   */
  private getCursor() {

    const current = this.data.value;

    if (current.length) {
      return this.query.prepend ? (<any>current)[0].doc : (<any>current)[current.length - 1].doc;
    }

    return null;

  }

  /**
   *Maps the snapshot to usable format the updates source
   *
   * @private
   * @param {AngularFirestoreCollection} collection collection path in db
   * @returns
   * @memberof PaginationService
   */
  private updateData(collection: AngularFirestoreCollection) {

    if (this.done.value || this.loading.value) {
      return;
    }

    // loading
    this.loading.next(true);

    // Map snapshot with doc ref (needed for cursor)
    return collection.snapshotChanges().pipe(
      tap(docs => {

        let values = docs.map(document => {
          const data = document.payload.doc.data();
          const doc = document.payload.doc;
          return { ...data, doc };
        });

        // If prepending, reverse the order
        values = this.query.prepend ? values.reverse() : values;

        // update source with new values, done loading
        this.data.next(values);
        this.loading.next(false);
        // this.isInitRequest$.next(false);

        // if no more values, mark done
        if (!values.length) {
          this.done.next(true);
        }

      }),
      take(1)
    ).subscribe();
  }

  // in case you prefered not to use (async) pipe and handel the data in (ts) file
  cancelSubscription() {
    this.subscription.unsubscribe();
    this.done.next(false);
    this.loading.next(false);
    this.data.next([]);
  }
}
