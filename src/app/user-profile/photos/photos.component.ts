import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { NgxMasonryOptions } from 'ngx-masonry';
import { AngularFireAuth } from '@angular/fire/auth';
import { map } from 'rxjs/operators';
import { Subscription, combineLatest } from 'rxjs';

import { UploadDialogComponent } from 'src/app/upload-dialog/upload-dialog.component';
import { UserService } from 'src/app/services/user.service';
import { UploadService } from 'src/app/services/upload.service';
import { Photo } from 'src/app/models/photo.model';

@Component({
  selector: 'ps-photos',
  templateUrl: './photos.component.html',
  styleUrls: ['./photos.component.scss']
})
export class PhotosComponent implements OnInit, OnDestroy {
  masnoryConfig: NgxMasonryOptions = {
    percentPosition: true,
    resize: true
  };
  photos: Photo[] = [];
  isOwner = false;
  mobileScreenDown = false;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private dialog: MatDialog,
    private uploadService: UploadService,
    private afAuth: AngularFireAuth,
    private breakpointService: BreakpointObserver
  ) { }

  ngOnInit() {
    this.subscriptions.add(this.route.queryParams.subscribe(
      param => this.userService.getUserPhotos(param['upi'])
    ));

    this.subscriptions.add(this.userService.userPhotos$.subscribe(
      photos => this.photos = photos
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

  private isBreakpointMatche(breakpoint: string, prefix = 'max'): boolean {
    return this.breakpointService.isMatched(`(${prefix}-width: ${breakpoint})`);
  }

  onUploadPhotos() {

    const dialogRef = this.dialog.open(UploadDialogComponent, {
      backdropClass: 'backdrop',
      closeOnNavigation: true,
      autoFocus: false
    });

    if (this.isBreakpointMatche('480px')) {
      dialogRef.updateSize('88vw');
    } else if (this.isBreakpointMatche('768px')) {
      dialogRef.updateSize('80vw');
    } else if (this.isBreakpointMatche('992px')) {
      dialogRef.updateSize('70vw');
    } else if (this.isBreakpointMatche('1200px')) {
      dialogRef.updateSize('60vw');
    } else if (this.isBreakpointMatche('1201px', 'min')) {
      dialogRef.updateSize('1100px');
    }

    dialogRef.afterClosed().subscribe((isSubmited: boolean) => {

      if (isSubmited) {

        this.uploadService.onSubmitUploadedPhotos();

      } else if (typeof isSubmited === 'undefined' || false) {

        this.uploadService.onUnsubmit();

      }

    });

  }

  ngOnDestroy() {
    this.userService.cancelSubscription();
    this.uploadService.cancelSubscription();
    this.subscriptions.unsubscribe();
  }

}
