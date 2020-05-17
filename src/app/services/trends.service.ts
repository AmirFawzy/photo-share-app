import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map, debounceTime, take } from 'rxjs/operators';

import { Photo } from '../models/photo.model';
import { UiService } from './ui.service';
import { GeneralData } from '../models/user.model';

export interface GeneralDataWithUID extends GeneralData {
  uid: string;
}

@Injectable({
  providedIn: 'root'
})
export class TrendsService {

  constructor(private db: AngularFirestore, private uiService: UiService) { }

  /**
   *Get most views photos
   *
   * @param {boolean} [loadingState=false] determine if loading bar should appear or not
   * @returns {Observable<any>}
   * @memberof TrendsService
   */
  getMostViewsPhotos(loadingState = false): Observable<Photo[]> {

    if (loadingState) {
      // this.uiService.loadingState.next(true);
    }

    const getPhotos = this.db.collection<Photo>('photos', ref => ref.where('views', '>', 0).orderBy('views', 'desc').limit(6))
      .snapshotChanges();

    return getPhotos.pipe(
      debounceTime(200),
      map(payload => {

        return payload.map(doc => {

          return ({
            ...doc.payload.doc.data(),
            publishedDate: new Date((<any>doc.payload.doc.data().publishedDate).seconds * 1000)
          }) as Photo;

        }) as Photo[];

      })
    );

  }

  /**
   *Get most likes photos
   *
   * @param {boolean} [loadingState=false] determine if loading bar should appear or not
   * @returns {Observable<any>}
   * @memberof TrendsService
   */
  getMostLikesPhotos(loadingState = false): Observable<Photo[]> {

    if (loadingState) {
      // this.uiService.loadingState.next(true);
    }

    const getPhotos = this.db.collection<Photo>('photos', ref => ref.where('likes', '>', 0).orderBy('likes', 'desc').limit(6))
      .snapshotChanges();


    return getPhotos.pipe(
      debounceTime(200),
      map(payload => {

        return payload.map(doc => {

          return ({
            ...doc.payload.doc.data(),
            publishedDate: new Date((<any>doc.payload.doc.data().publishedDate).seconds * 1000)
          }) as Photo;

        }) as Photo[];

      })
    );

  }

  getTopPhotographers(): Observable<GeneralDataWithUID[]> {

    // this.uiService.loadingState.next(true);

    const getPhotographers = this.db.collection<GeneralDataWithUID>('users', ref => ref
      .where('viewsNum', '>', 0)
      .orderBy('viewsNum', 'desc'))
      .snapshotChanges();

    return getPhotographers.pipe(
      debounceTime(200),
      take(10),
      map(payload => payload.map(doc => {

        const data = doc.payload.doc.data();
        const uid = doc.payload.doc.id;

        return {
          ...data,
          uid: uid,
          signoutTime: new Date((<any>data.signoutTime).seconds * 1000)
        };

      }))
    );

  }

  getTopPhotographersForRatingBadge(): Observable<GeneralDataWithUID[]> {

    // this.uiService.loadingState.next(true);

    const getPhotographers = this.db.collection<GeneralDataWithUID>('users', ref => ref
      .where('viewsNum', '>', 0)
      .orderBy('viewsNum', 'desc'))
      .snapshotChanges();

    return getPhotographers.pipe(
      debounceTime(200),
      take(10),
      map(payload => payload.map(doc => {

        const data = doc.payload.doc.data();
        const uid = doc.payload.doc.id;

        return {
          ...data,
          uid: uid,
          signoutTime: new Date((<any>data.signoutTime).seconds * 1000)
        };

      }))
    );

  }
}
