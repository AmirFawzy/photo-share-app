import { Component, OnInit, ElementRef, ViewChild, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver } from '@angular/cdk/layout';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';

import { PhotoDeleteDialogComponent } from './photo-delete-dialog/photo-delete-dialog.component';
import { PhotoEditDialogComponent } from './photo-edit-dialog/photo-edit-dialog.component';
import { AddToCollectionDialogComponent } from './add-to-collection-dialog/add-to-collection-dialog.component';
import { ShareBtnsDialogComponent } from './share-btns-dialog/share-btns-dialog.component';
import { LoginComponent } from 'src/app/shared/login/login.component';
import { Photo } from 'src/app/models/photo.model';
import { PhotoService } from 'src/app/services/photo.service';
import { UiService } from 'src/app/services/ui.service';
import { AuthService } from 'src/app/services/auth.service';
import { CollectionService } from 'src/app/services/collection.service';

interface FullscreenDoc extends HTMLDocument {
  mozCancelFullScreen?: () => void;
  webkitExitFullscreen?: () => void;
  fullscreenElement: Element;
  mozFullScreenElement?: Element;
  webkitFullscreenElement?: Element;
}

@Component({
  selector: 'ps-photo',
  templateUrl: './photo.component.html',
  styleUrls: ['./photo.component.scss']
})
export class PhotoComponent implements OnInit, OnDestroy {
  @ViewChild('fullscreen', { static: false }) fullscreenEle: ElementRef;
  photo: Photo;
  isOwner = false;
  isFullscreen = false;
  isUserLikeThePhoto: boolean;
  windowWidth = window.innerWidth;
  isAuth: boolean;
  private userId: string;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private authService: AuthService,
    private photoService: PhotoService,
    private afAuth: AngularFireAuth,
    private uiService: UiService,
    private collectionService: CollectionService,
    private breakpointService: BreakpointObserver
  ) { }

  ngOnInit() {
    this.subscriptions.add(this.authService.authChange.subscribe(
      (authState: boolean) => this.isAuth = authState
    ));

    this.subscriptions.add(this.afAuth.authState.subscribe(
      user => user ? this.userId = user.uid : this.userId = null
    ));

    this.subscriptions.add(this.photoService.photo$.subscribe(
      (photo: Photo) => {

        this.photo = photo;

        if (this.userId === photo.owner.id) {
          this.isOwner = true;
        } else {
          this.isOwner = false;
        }

      }
    ));

    this.subscriptions.add(this.photoService.likeState$.subscribe(
      likeState => this.isUserLikeThePhoto = likeState
    ));
  }

  @HostListener('window:resize', []) onresize() {
    this.windowWidth = window.innerWidth;
  }

  openFullscreen() {

    if (this.fullscreenEle.nativeElement.requestFullscreen) {

      this.fullscreenEle.nativeElement.requestFullscreen();
      this.isFullscreen = true;

    } else if (this.fullscreenEle.nativeElement.mozRequestFullscreen) {

      this.fullscreenEle.nativeElement.mozRequestFullscreen();
      this.isFullscreen = true;

    } else if (this.fullscreenEle.nativeElement.webkitRequestFullscreen) {

      this.fullscreenEle.nativeElement.webkitRequestFullscreen();
      this.isFullscreen = true;

    }

  }

  exitFullscreen() {

    if ((<FullscreenDoc>document).fullscreenElement) {

      document.exitFullscreen();
      this.isFullscreen = false;

    } else if ((<FullscreenDoc>document).mozCancelFullScreen) {

      (<FullscreenDoc>document).mozCancelFullScreen();
      this.isFullscreen = false;

    } else if ((<FullscreenDoc>document).webkitExitFullscreen) {

      (<FullscreenDoc>document).webkitExitFullscreen();
      this.isFullscreen = false;

    }

    // if indicatorBageEle exist remove the node form dom
    const indicatorBadgeEle = document.querySelector('.indicator-badge');
    if (indicatorBadgeEle) {
      indicatorBadgeEle.remove();
    }

  }

  /**
   * on mousemove
   * @if browser is not in fullscreen mode
   * excute @this exitFullscreen() method
   */
  @HostListener('mousemove') onmousemoving() {
    if (!document.fullscreen) {
      this.exitFullscreen();
    }
  }

  private breakpointIsMatched(breakpoint: string, prefix = 'max'): boolean {
    return this.breakpointService.isMatched(`(${prefix}-width: ${breakpoint})`);
  }

  onLikePhoto() {

    if (this.isAuth) {
      this.photoService.addLikeRemoveLike(this.photo.id);
    }

    if (!this.isAuth) {

      const dialogRef = this.dialog.open(LoginComponent, {
        backdropClass: 'backdrop',
        closeOnNavigation: true,
        autoFocus: false
      });

      if (this.breakpointIsMatched('480px')) {
        dialogRef.updateSize('80vw');
      } else if (this.breakpointIsMatched('768px')) {
        dialogRef.updateSize('70vw');
      } else if (this.breakpointIsMatched('992px')) {
        dialogRef.updateSize('60vw');
      } else if (this.breakpointIsMatched('1200px')) {
        dialogRef.updateSize('50vw');
      } else if (this.breakpointIsMatched('1201px', 'min')) {
        dialogRef.updateSize('600px');
      }

    }

  }

  /**
   *On delete the photo open confirm dialog
   *
   * @memberof PhotoComponent
   * @constant {MatDialogRef} dialogRef dialog component and options
   * @method `deletePhoto()` excute if `result` was true
   */
  onDelete() {

    const dialogRef = this.dialog.open(PhotoDeleteDialogComponent, {
      backdropClass: 'backdrop',
      closeOnNavigation: true,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {

      if (result) {

        if (this.photo.collections.length) {
          this.photo.collections.forEach(collectionId => {
            this.collectionService.removePhotoFromCollection(collectionId, this.photo.id);
          });
        }

        this.photoService.deletePhoto(this.photo);

      }

    });

  }

  /**
   *On edit the photo
   *
   * @memberof PhotoComponent
   * @constant `dialogRef` dialog component and options
   *
   * if conditions for media query
   *
   * @if true -- there's a new edit
   * @method `updatePhoto()` excute to send new updates to db
   * @if false -- no updates added
   * @method `getPhoto()` excute to get photo object from db and show friendly msg
   */
  onEdit() {

    const dialogRef = this.dialog.open(PhotoEditDialogComponent, {
      backdropClass: 'backdrop',
      closeOnNavigation: true,
      autoFocus: false,
      data: {
        photo: this.photo
      }
    });

    if (this.breakpointIsMatched('480px')) {
      dialogRef.updateSize('76vw');
    } else if (this.breakpointIsMatched('768px')) {
      dialogRef.updateSize('66vw');
    } else if (this.breakpointIsMatched('992px')) {
      dialogRef.updateSize('56vw');
    } else if (this.breakpointIsMatched('1200px')) {
      dialogRef.updateSize('46vw');
    } else if (this.breakpointIsMatched('1201px', 'min')) {
      dialogRef.updateSize('560px');
    }

    dialogRef.afterClosed().subscribe(newEdit => {

      if (newEdit) {

        this.photoService.updatePhoto(this.photo.id, {
          ...newEdit.otherData,
          title: newEdit.formData.title as string,
          description: newEdit.formData.description as string,
          location: newEdit.formData.countries as string,
          locationDetails: newEdit.formData.cities as string,
          isNodity: newEdit.formData.nodity as boolean,
          camera: { model: newEdit.formData.camera }
        });

      } else {

        this.photoService.getPhoto(this.photo.id);
        this.uiService.respondMessage('Changes unsaved!');

      }

    });

  }

  onAddToCollection() {

    if (this.isAuth) {

      const dialogRef = this.dialog.open(AddToCollectionDialogComponent, {
        backdropClass: 'backdrop',
        closeOnNavigation: true,
        autoFocus: false,
        data: {
          photoId: this.photo.id,
          userId: this.userId
        }
      });

      if (this.breakpointIsMatched('480px')) {
        dialogRef.updateSize('380px');
      } else if (this.breakpointIsMatched('1919.99px')) {
        dialogRef.updateSize('400px');
      } else if (this.breakpointIsMatched('1920', 'min')) {
        dialogRef.updateSize('500px');
      }

      dialogRef.afterClosed().subscribe((result: { selected: string[], unselected: string[] }) => {

        // if there's a result not undefined nor null
        if (result) {

          result.selected.forEach(collectionId => {
            this.collectionService.addPhotoToCollection(collectionId, this.photo.id);
          });

          result.unselected.forEach(collectionId => {
            this.collectionService.removePhotoFromCollection(collectionId, this.photo.id);
          });

        }

      });

    }

    if (!this.isAuth) {

      const dialogRef = this.dialog.open(LoginComponent, {
        backdropClass: 'backdrop',
        closeOnNavigation: true,
        autoFocus: false
      });

      if (this.breakpointIsMatched('480px')) {
        dialogRef.updateSize('80vw');
      } else if (this.breakpointIsMatched('768px')) {
        dialogRef.updateSize('70vw');
      } else if (this.breakpointIsMatched('992px')) {
        dialogRef.updateSize('60vw');
      } else if (this.breakpointIsMatched('1200px')) {
        dialogRef.updateSize('50vw');
      } else if (this.breakpointIsMatched('1201px', 'min')) {
        dialogRef.updateSize('600px');
      }

    }

  }

  onShare() {
    const dialogRef = this.dialog.open(ShareBtnsDialogComponent, {
      backdropClass: 'backdrop',
      closeOnNavigation: true,
      autoFocus: false,
      data: {
        url: this.router.url
      }
    });
  }

  ngOnDestroy() {
    this.collectionService.cancelSubscriptions();
    this.subscriptions.unsubscribe();
  }

}
