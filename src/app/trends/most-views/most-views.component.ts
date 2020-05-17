import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { NgxMasonryOptions } from 'ngx-masonry';
import { Photo } from 'src/app/models/photo.model';
import { TrendsService } from 'src/app/services/trends.service';
import { UiService } from 'src/app/services/ui.service';

@Component({
  selector: 'ps-most-views',
  templateUrl: './most-views.component.html',
  styleUrls: ['./most-views.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MostViewsComponent implements OnInit, OnDestroy {
  masnoryConfig: NgxMasonryOptions = {
    percentPosition: true,
    resize: true
  };
  photos: Photo[];
  private subscriptions: Subscription = new Subscription();

  constructor(private trendsService: TrendsService, private uiService: UiService) { }

  ngOnInit() {
    this.subscriptions.add(this.trendsService.getMostViewsPhotos(true).subscribe(
      photos => {
        this.uiService.loadingState.next(false);
        this.photos = photos;
      }
    ));
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
