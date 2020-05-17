import { Component, OnInit, ViewEncapsulation, HostListener, ChangeDetectorRef, AfterViewInit, OnDestroy } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';

import { Photo } from '../../models/photo.model';
import { AuthService } from '../../services/auth.service';
import { UiService } from '../../services/ui.service';
import { TrendsService } from 'src/app/services/trends.service';

interface ContainerDimension<T> {
  width: T;
  height: T;
}

type getTypeofProperties<T> = T extends { [K in keyof ContainerDimension<string | number>]: infer U } ? U : never;

@Component({
  selector: 'ps-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  heroContainerW: getTypeofProperties<ContainerDimension<number>>;
  heroContainerH: getTypeofProperties<ContainerDimension<number>>;
  isAuth: boolean;
  mostViewsPhotos: Photo[];
  mostLikesPhotos: Photo[];
  mobileScreenBelow = false;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private cd: ChangeDetectorRef,
    private authService: AuthService,
    private uiService: UiService,
    private trendsService: TrendsService,
    private breakpointService: BreakpointObserver
  ) {
    this.heroContainerW = window.innerWidth;
    this.heroContainerH = window.innerHeight;
  }

  ngOnInit() {
    this.authService.authChange.subscribe((authState: boolean) => this.isAuth = authState);

    this.uiService.loadingState.next(false);

    this.subscriptions.add(this.trendsService.getMostViewsPhotos().subscribe(
      photos => this.mostViewsPhotos = photos
    ));

    this.subscriptions.add(this.trendsService.getMostLikesPhotos().subscribe(
      photos => this.mostLikesPhotos = photos
    ));

    this.subscriptions.add(this.breakpointService
      .observe(['(max-width: 576px)'])
      .subscribe(breakpoint => {

        if (breakpoint.breakpoints['(max-width: 576px)']) {

          this.mobileScreenBelow = true;

        } else {
          this.mobileScreenBelow = false;
        }

      }));
  }

  ngAfterViewInit() {
    this.cd.detectChanges();
  }

  // on window resize update the width and height of the canvas
  @HostListener('window:resize', []) onResize() {
    this.heroContainerW = window.innerWidth;
    this.heroContainerH = window.innerHeight;
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
