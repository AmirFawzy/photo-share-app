import { Component, OnInit, OnDestroy } from '@angular/core';
import { trigger, transition, useAnimation } from '@angular/animations';
import { Subscription } from 'rxjs';

import { TrendsService, GeneralDataWithUID } from 'src/app/services/trends.service';
import { UiService } from 'src/app/services/ui.service';
import { fadeInDown } from 'src/app/animations/fading-down-animation';

@Component({
  selector: 'ps-top-photographers',
  templateUrl: './top-photographers.component.html',
  styleUrls: ['./top-photographers.component.scss'],
  animations: [
    trigger('fadeInDown', [
      transition('* <=> *', [
        useAnimation(fadeInDown)
      ])
    ])
  ]
})
export class TopPhotographersComponent implements OnInit, OnDestroy {
  photographers: GeneralDataWithUID[];
  private subscription: Subscription = new Subscription();

  constructor(private trendsService: TrendsService, private uiService: UiService) { }

  ngOnInit() {
    this.subscription.add(this.trendsService.getTopPhotographers().subscribe(
      photographers => {
        this.uiService.loadingState.next(false);
        this.photographers = photographers;
      }
    ));
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
