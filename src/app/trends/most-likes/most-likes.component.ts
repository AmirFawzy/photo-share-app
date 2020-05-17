import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { Photo } from 'src/app/models/photo.model';
import { NgxMasonryOptions } from 'ngx-masonry';
import { TrendsService } from 'src/app/services/trends.service';
import { UiService } from 'src/app/services/ui.service';

@Component({
  selector: 'ps-most-likes',
  templateUrl: './most-likes.component.html',
  styleUrls: ['./most-likes.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MostLikesComponent implements OnInit, OnDestroy {
  readonly masnoryConfig: NgxMasonryOptions = {
    percentPosition: true,
    resize: true
  };
  photos: Photo[];
  private subscription: Subscription = new Subscription();

  constructor(private trendsService: TrendsService, private uiService: UiService) { }

  ngOnInit() {
    this.subscription.add(this.trendsService.getMostLikesPhotos(true).subscribe(
      photos => {
        this.uiService.loadingState.next(false);
        this.photos = photos;
      }
    ));
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
