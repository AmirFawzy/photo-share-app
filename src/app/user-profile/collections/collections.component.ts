import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { map } from 'rxjs/operators';
import { Subscription, combineLatest } from 'rxjs';

import { Collection } from 'src/app/models/collection.model';
import { CollectionService } from 'src/app/services/collection.service';


@Component({
  selector: 'ps-collections',
  templateUrl: './collections.component.html',
  styleUrls: ['./collections.component.scss']
})
export class CollectionsComponent implements OnInit, OnDestroy {
  /**
   *All user collections
   *
   * @type {Collection[]}
   * @memberof CollectionsComponent
   */
  collections: Collection[] = [];

  /**
   *Holds definition if the current user is the owner of that profile
   *
   * @memberof CollectionsComponent
   */
  isOwner = false;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private collectionService: CollectionService,
    private afAuth: AngularFireAuth
  ) { }

  ngOnInit() {
    this.subscriptions.add(this.route.queryParams.subscribe(
      param => this.collectionService.getUserCollections(param['upi'])
    ));

    this.subscriptions.add(this.collectionService.collections$.subscribe(
      collections => this.collections = collections
    ));

    this.subscriptions.add(combineLatest(
      this.route.queryParams,
      this.afAuth.authState
    ).pipe(
      map(value => {

        if (value[0] && value[1]) {

          if (value[0]['upi'] === value[1].uid) {
            return true;
          }

        }

        return false;

      })
    ).subscribe(result => this.isOwner = result));
  }

  /**
   *Navigate to collection page based on clicked collection
   *
   * @param {string} collectionId collection id sent during route in query param
   * @param {string} collectionName collection name for route param
   * @memberof CollectionsComponent
   */
  onCollection(collectionId: string, collectionName: string): void {

    const collectionNameTransform = collectionName.toLowerCase().split(' ').join('-');

    this.router.navigate(['collection', collectionNameTransform], {
      relativeTo: this.route,
      queryParams: { ci: collectionId },
      queryParamsHandling: 'merge'
    });

  }

  /**
   *Create new collection
   *
   * @memberof CollectionsComponent
   */
  onNewCollection() {
    this.collectionService.addNewCollection();
  }

  ngOnDestroy() {
    this.collectionService.cancelSubscriptions();
    this.subscriptions.unsubscribe();
  }

}
