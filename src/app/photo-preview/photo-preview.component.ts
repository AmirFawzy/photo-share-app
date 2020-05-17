import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { trigger, transition, query, useAnimation, style, stagger, animate } from '@angular/animations';

import { PhotoService } from '../services/photo.service';
import { UserService } from '../services/user.service';
import { Subscription } from 'rxjs';
import { fadingStaggerAnimation } from '../animations/fading-animation';

@Component({
  selector: 'ps-photo-preview',
  templateUrl: './photo-preview.component.html',
  styleUrls: ['./photo-preview.component.scss'],
  animations: [
    trigger('fadeAnimation', [
      transition('* <=> *', [
        useAnimation(fadingStaggerAnimation(':enter', '1s', 'ease', 100))
      ])
    ])
  ]
})
export class PhotoPreviewComponent implements OnInit, OnDestroy {
  private photoId: string;
  private subscription: Subscription = new Subscription();
  isLoadingPhotoDone = false;

  constructor(
    private route: ActivatedRoute,
    private photoService: PhotoService,
    private userService: UserService
  ) { }

  ngOnInit() {
    this.route.params.subscribe(
      params => this.photoId = params['id']
    );

    this.photoService.getPhoto(this.photoId);
    this.photoService.addViews(this.photoId);
    this.photoService.getLikes(this.photoId);
    this.photoService.getComments(this.photoId);

    this.subscription.add(this.photoService.photo$.subscribe(
      photo => photo ? this.isLoadingPhotoDone = true : this.isLoadingPhotoDone = false
    ));
  }

  ngOnDestroy() {
    this.photoService.cancelSubscription();
    this.userService.cancelSubscription();
    this.subscription.unsubscribe();
  }
}
