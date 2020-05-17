import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { Photo } from '../models/photo.model';
import { NgxMasonryOptions } from 'ngx-masonry';
import { SearchService } from '../services/search.service';
import { UiService } from '../services/ui.service';

@Component({
  selector: 'ps-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SearchComponent implements OnInit, OnDestroy {
  /**
   *Number of search result
   *
   * @type {number}
   * @memberof SearchComponent
   */
  searchResultLength: number;

  /**
   *The search keyword
   *
   * @type {string}
   * @memberof SearchComponent
   */
  searchKeyword: string;

  /**
   *Photos array holds all photos recived from search
   *
   * @type {Photo[]}
   * @memberof SearchComponent
   */
  photos: Photo[] = [];

  /**
   *Related keywords for the search keyword
   *
   * @type {string[]}
   * @memberof SearchComponent
   */
  relatedSearchKeyword: string[] = [];

  /**
   *Holds all component subscription
   *
   * @type {Subscription[]}
   * @memberof SearchComponent
   */
  subscriptions: Subscription = new Subscription();
  loadingSkeleton: boolean;
  masnoryConfig: NgxMasonryOptions = {
    percentPosition: true,
    resize: true
  };

  constructor(
    private route: ActivatedRoute,
    private searchService: SearchService
  ) { }

  ngOnInit() {
    // Get the keyword from route
    this.route.params.subscribe(
      (params: Params) => this.searchKeyword = params['keyword']
    );

    this.searchService.getPhotosByKeyword(this.searchKeyword.split('-').join(' '));

    this.subscriptions.add(this.searchService.loadingSkeleton.subscribe(
      skeletonState => this.loadingSkeleton = skeletonState
    ));

    /**
     *Subscrbe for `searchResult`
     *
     * @param {Photo[]} photos is the photos array
     * @memberof SearchComponent
     *
     * @if true
     *
     ** make observable from `photos`
     ** `take` 8 then `map` photos array
     * @return array of keywords `this.searchKeyword` excluded
     ** `map` the array of keywords and remove all duplicated words
     * @return array of keywords then subscribe the result to `relatedSearchKeyword`
     * @else false reset `relatedSearchKeyword` to null
     */
    this.subscriptions.add(this.searchService.searchResults.subscribe((photos: Photo[]) => {

      this.photos = photos;
      this.searchResultLength = photos.length;

      if (photos.length) {

        this.subscriptions.add(of(photos).pipe(
          take(8),
          map(streamPhotos => {

            const keywords: string[] = [];

            streamPhotos.forEach(photo => {
              photo.keywords.forEach(keyword => keywords.push(keyword));
            });

            return keywords.filter(keyword => keyword !== this.searchKeyword.split('-').join(' '));

          }),
          map(keywords => {

            // remove duplicated keyword from array and return unique ones
            const uniqueKeywords: string[] = keywords.filter((k, i, a) => a.indexOf(k) === i);

            return uniqueKeywords;

          })
        ).subscribe(keywords => this.relatedSearchKeyword = keywords));

      } else {

        this.relatedSearchKeyword = null;

      }

    }));
  }

  /**
   *On click on chip
   *
   * @param {string} keyword the word for search
   * @memberof SearchComponent
   *
   * excute `getPhotosBykeyword` to get search result
   */
  onChip(keyword: string) {
    this.searchService.getPhotosByKeyword(keyword);
  }

  /**
   *On destroy unsubscripe all supscription
   *
   * @memberof SearchComponent
   */
  ngOnDestroy() {
    this.searchService.cancelSubscription();
    this.subscriptions.unsubscribe();
  }
}
