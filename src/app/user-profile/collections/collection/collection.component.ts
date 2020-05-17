import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BreakpointObserver } from '@angular/cdk/layout';
import { trigger, transition, useAnimation } from '@angular/animations';
import { MatCheckboxChange, MatCheckbox } from '@angular/material/checkbox';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { switchMap, takeWhile, map } from 'rxjs/operators';

import { DeleteCollectionDialogComponent } from './delete-collection-dialog/delete-collection-dialog.component';
import { Collection } from 'src/app/models/collection.model';
import { Photo } from 'src/app/models/photo.model';
import { countriesList, CountriesList } from 'src/app/models/countries-list.model';
import { worldCities, Cities } from 'src/app/models/world-cities.model';
import { CollectionService } from 'src/app/services/collection.service';
import { UiService } from 'src/app/services/ui.service';
import { PhotoService } from 'src/app/services/photo.service';
import { UploadDialogComponent } from 'src/app/upload-dialog/upload-dialog.component';
import { UploadService } from 'src/app/services/upload.service';
import { fadeInDown } from 'src/app/animations/fading-down-animation';

interface PhotoDefinition extends Photo {
  thumbnails: {
    thum500: {
      downloadUrl: string;
      storagePath: string;
    }
  };
}

@Component({
  selector: 'ps-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('contentAnimation', [
      transition('* <=> *', [
        useAnimation(fadeInDown)
      ])
    ])
  ]
})
export class CollectionComponent implements OnInit, OnDestroy {
  collection: Collection;
  photos: Photo[] | PhotoDefinition[];
  selectedPhoto: Photo[] = [];
  collectionEditForm: FormGroup;
  photoEditForm: FormGroup;
  cities: string[] = [];
  isLocationExist = false;
  isThatTheSameUserUid = false;
  tabletScreenDown = false;   // breakpoint 768px and up
  readonly countries = countriesList;
  private worldCities = worldCities;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private router: Router,
    public route: ActivatedRoute,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private collectionService: CollectionService,
    private uiService: UiService,
    private afAuth: AngularFireAuth,
    private photoService: PhotoService,
    private uploadService: UploadService,
    private breakpointService: BreakpointObserver
  ) {
    // collection form
    this.collectionEditForm = this.fb.group({
      collectionTitle: ['', Validators.required],
      keywords: [''],
      description: ['']
    });

    // photo form
    this.photoEditForm = this.fb.group({
      photoTitle: ['', Validators.required],
      keywords: [''],
      description: [''],
      country: [''],
      city: [{ value: '', disabled: this.isLocationExist }],
      nodity: [false],
      camera: [''],
      tools: [''],
      software: ['']
    });
  }

  ngOnInit() {
    this.countries.sort(this.sortByAlphabet);

    const collectionId = this.route.snapshot.queryParams['ci'];

    /**
     * excute `getCollectionById` method
     *
     * take value emitted as long as condition in `takeWhile` is true... if false stop emission
     * that will prevent excute `getCollectionPhoto` method multiple time which make
     * undesirable behavior
     *
     * stop loading, assign `collection` property, patch collection form values
     *
     * loop on `photos[]` in collection and excute `getCollectionPhoto`
     */
    this.subscriptions.add(this.collectionService.getCollectionById(collectionId).pipe(
      takeWhile(collection => collection !== this.collection)
    ).subscribe(
      collection => {
        this.uiService.loadingState.next(false);

        this.collection = collection;

        this.collectionEditForm.patchValue({
          collectionTitle: this.collection.title,
          description: this.collection.description
        });

        collection.photos.forEach(id => this.collectionService.getCollectionPhoto(id));
      }
    ));

    /**
     * subscribe the mutate the data emits by observable
     *
     * @const uniquePhotos is the new photos array with undoublicated items
     *
     * loop through the `photos[]`
     *
     * @const idx check if any item in [uniquePhotos] has same id as [photo] (current loop item)
     * if exist return the item index -- if false return -1
     *
     * if true add [photo] (current loop item) to [uniquePhotos] then return it
     */
    this.subscriptions.add(this.collectionService.collectionPhotos$.pipe(
      map(photos => {
        const uniquePhotos: Photo[] = [];

        photos.forEach(photo => {
          const idx = uniquePhotos.findIndex(p => p.id === photo.id);

          if (idx <= -1) {
            uniquePhotos.push(photo);
          }

        });

        return uniquePhotos;
      })
    ).subscribe(
      photos => {
        this.photos = photos;
      }
    ));

    this.subscriptions.add(this.collectionService.getCollectionById(collectionId).pipe(
      switchMap(() => this.afAuth.authState)
    ).subscribe(user => {
      if (user.uid === this.collection.owner.id) {
        this.isThatTheSameUserUid = true;
      }
    }));

    this.subscriptions.add(this.breakpointService
      .observe(['(max-width: 768px)'])
      .subscribe(state => state.matches ? this.tabletScreenDown = true : this.tabletScreenDown = false));
  }

  /**
   *On submit collection from to update the collection
   *
   * @memberof CollectionComponent
   * @constant collectionEditForm coleection from value object
   * @method `updateCollection` excute to send new updates to database
   */
  onSubmitCollection() {
    const collectionFormValue = this.collectionEditForm.value;

    this.collectionService.updateCollection(this.collection.id, {
      title: collectionFormValue.collectionTitle,
      description: collectionFormValue.description,
      keywords: this.collection.keywords
    });
  }

  /**
   *On submit edit on photo
   *
   * @memberof CollectionComponent
   * @constant {photo} photo is selected photo to edit
   * @constant {any} photoFormValue value object of photo edit form
   * @method `updatePhoto` in [photoService] execution to send updates to db
   */
  onSubmitPhoto() {
    const photo = this.selectedPhoto[0];
    const photoFormValue = this.photoEditForm.value as any;

    this.photoService.updatePhoto(photo.id, {
      ...photo,
      title: photoFormValue.photoTitle as string,
      description: photoFormValue.description as string,
      keywords: photo.keywords,
      location: photoFormValue.country as string,
      locationDetails: photoFormValue.city as string,
      isNodity: photoFormValue.nodity as boolean,
      camera: {
        model: photoFormValue.camera as string
      },
      tools: photo.tools,
      software: photo.software
    });
  }

  /**
   * on remove one of collection (keywords)
   * @param keyword value recived from event
   * @const index the index of the keyword target to remove
   * remove [keyword] from the keywords of @param collection<Collection>
   */
  onRemoveCollectionChip(keyword: string) {
    const index = this.collection.keywords.indexOf(keyword);

    if (index >= 0) {
      this.collection.keywords.splice(index, 1);
    }
  }

  /**
   * on add new keyword to the collection
   * @param evt the recived event from adding event
   * @const value the value recived from event
   * add the [value] to the keywords of @param collection<Collection>
   */
  onAddCollectionChip(evt: MatChipInputEvent) {
    const value = evt.value;

    if ((value || '').trim()) {
      this.collection.keywords.push(value.toLowerCase().trim());
    }

    this.collectionEditForm.get('keywords').reset();
  }

  /**
   * open delete collection dialog confirmation
   * @param result <boolean> recived after close the dialog
   * @if true @const userProfileId user id need it for query params
   * empty @this collection (delete the collection)
   * then navigate back to user profile
   */
  onDeleteCollection() {
    const dialogRef = this.dialog.open(DeleteCollectionDialogComponent, {
      backdropClass: 'backdrop',
      closeOnNavigation: true,
      autoFocus: false,
      data: {
        collectionTitle: this.collection.title
      }
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        const userProfileId = this.route.snapshot.queryParams['upi'];

        this.collectionService.deleteCollection(this.collection.id).finally(() => {
          this.router.navigate(['../../'], { relativeTo: this.route, queryParams: { upi: userProfileId } });
        });
      }
    });
  }

  // to get photo form controler by control name
  private getControlerValuePhotoForm<T>(controlerName: string): T {
    return this.photoEditForm.get(controlerName).value;
  }

  /**
   * on photo select to edit
   * @param evt [@description MatCheckboxChange]
   * @const checkedPhotoId [@description MatCheckbox] the value of the checkbox is the 'photoId'
   * @const isChecked boolean if photo selected or not
   *
   * @if true @loop on @this collection.photos
   * @if true add @param photo <object> to @this selectedPhoto
   *
   * @elseIf false @loop on @this selectedPhoto @param photo in photo <object> @param idx is the index
   * @if true remove [photo] <object> from @this selectedPhoto
   *
   * @if true patch the value of @this photoEditForm
   * @if true @loop on @this worldCities
   * @param city is the city <object>
   * @const selectedPhotoLocation the location (country) of the selected photo
   * @if true push [city] to @this cities <array>
   *
   * @if true set @this isLocationExist to true otherwise set to false
   */
  onPhotoSelect(evt: MatCheckboxChange): void {
    const isChecked = evt.checked;
    const checkedPhotoId = (<MatCheckbox>evt.source).value;

    if (isChecked) {

      this.photos.forEach((photo: Photo) => {

        if (photo.id === checkedPhotoId) {
          this.selectedPhoto.push(photo);
        }

      });

    } else if (!isChecked && this.selectedPhoto.length) {

      this.selectedPhoto.forEach((photo: Photo, idx: number) => {

        if (photo.id === checkedPhotoId) {
          this.selectedPhoto.splice(idx, 1);
        }

      });

    }
    if (this.selectedPhoto.length && (this.selectedPhoto.length < 2)) {

      this.photoEditForm.patchValue({
        photoTitle: this.selectedPhoto[0].title,
        description: this.selectedPhoto[0].description,
        country: this.selectedPhoto[0].location,
        city: this.selectedPhoto[0].locationDetails,
        nodity: this.selectedPhoto[0].isNodity,
        camera: this.selectedPhoto[0].camera.model,
      });

      // get the city of the country
      if (this.getControlerValuePhotoForm<string>('country')) {

        this.worldCities.forEach((city: Cities) => {
          const selectedPhotoLocation = this.selectedPhoto[0].location.toLowerCase();

          if (city.country.toLowerCase() === selectedPhotoLocation) {
            this.cities.push(city.name);
            this.cities.sort();
          }

        });

      }

      if (this.getControlerValuePhotoForm<string>('country').length > 0) {

        this.isLocationExist = true;

      } else {

        this.isLocationExist = false;

      }

    }
  }

  /**
   * on delete photo loop on @this selectedPhoto
   * @param photoSelected is the photos object in @this SeletedPhoto
   * @param i is the index of [photoSelected] in the array
   * @param photo the photo object in @this collection.photos
   * @param idx is the index of [photo] object in the array
   * @if true remove photo from @this collection.photos
   * remove [photo] object form the @this selectedPhoto
   * @this onDeletePhoto repeate excution until @if false
   */
  onDeletePhoto(): void {
    this.collectionService.deletePhotoFromCollection(this.collection.id, this.selectedPhoto)
      .then(() => {

        this.collectionService.getCollectionById(this.collection.id);

      })
      .then(() => {

        this.selectedPhoto.forEach((selectedPhoto, selectedIdx) => {
          this.photos.forEach((photo, idx) => {

            if (selectedPhoto.id === photo.id) {

              this.photos.splice(idx, 1);
              this.selectedPhoto.splice(0);

            }

          });
        });

      });
  }

  /**
   * on remove one of Photo (keywords)
   * @param chipValue value recived from event (keyword)
   * whereas there's no more than one [photo] object in @this selectedPhoto array
   * @loop on keywords @param keyword is the keyword and @param idx is the index of this keyword
   * @if true remove [keyword] from the keywords of @this selectedPhoto[0]
   */
  onRemovePhotoChip(chipValue: string): void {

    this.selectedPhoto[0].keywords.forEach((keyword: string, idx: number) => {

      if (chipValue === keyword) {
        this.selectedPhoto[0].keywords.splice(idx, 1);
      }

    });

  }

  /**
   * on add new keyword to the photo (selected one)
   * @param evt the recived event from adding event
   * @const value the value recived from event
   * add [value] to @array keywords in @this selectedPhoto[0]
   * reset keywords input
   */
  onAddPhotoChip(evt: MatChipInputEvent): void {
    const value = evt.value;

    if ((value || '').trim()) {
      this.selectedPhoto[0].keywords.push(value.toLowerCase().trim());
    }

    this.photoEditForm.get('keywords').reset();
  }

  /**
   * on select city of the city 'select input'
   * @param evt [@description MatSelectChange]
   * @const selectVal get the select value
   * empty @this cities array
   * @if true add all cities of that country to @this cities
   *
   * @if true set @this isLocationExist to true otherwise set it to false
   */
  onSelectionChange(evt: MatSelectChange): void {
    const selectVal = evt.value.toLowerCase();

    this.cities = [];

    this.worldCities.forEach((city: Cities) => {

      if (selectVal === city.country.toLowerCase()) {
        this.cities.push(city.name);
        this.cities.sort();
      }

    });

    if (this.getControlerValuePhotoForm<string>('country').length > 0) {

      this.isLocationExist = true;

    } else {

      this.isLocationExist = false;

    }
  }

  /**
   * on add tool get chip value
   * @param evt [@description MatChipInputEvent]
   * @const val mat chip value <string>
   * @if true push chip value to tools array of @this selectedPhoto[0].tools
   * reset the input
   */
  onAddTool(evt: MatChipInputEvent) {
    const val = evt.value;

    if ((val || '').trim()) {
      this.selectedPhoto[0].tools.push(val.toLowerCase());
    }

    evt.input.value = '';
  }

  /**
   * on remove tool
   * @param idx index of the current tool
   * remove this tool from tool array of @this selectedPhoto[0].tools
   */
  onRemoveTool(idx: number) {
    this.selectedPhoto[0].tools.splice(idx, 1);
  }

  /**
   * on add software get chip value
   * @param evt [@description MatChipInputEvent]
   * @const val mat chip value <string>
   * @if true push chip value to tools array of @this selectedPhoto[0].software
   * reset the input
   */
  onAddSoftware(evt: MatChipInputEvent) {
    const val = evt.value;

    if ((val || '').trim()) {
      (<string[]>this.selectedPhoto[0].software).push(val.toLowerCase());
    }

    evt.input.value = '';
  }

  /**
   * on remove software
   * @param idx index of the current tool
   * remove this tool from tool array of @this selectedPhoto[0].software
   */
  onRemoveSoftware(idx: number) {
    this.selectedPhoto[0].software.splice(idx, 1);
  }

  // sort by alphabet
  private sortByAlphabet<T extends CountriesList>(a: T, b: T): number {
    if (a.Name < b.Name) {
      return -1;
    }
    if (a.Name > b.Name) {
      return 1;
    }
    return 0;
  }

  private breakpointIsMatched(breakpoint: string, prefix = 'max'): boolean {
    return this.breakpointService.isMatched(`(${prefix}-width: ${breakpoint})`);
  }

  onUploadPhotos() {
    const wWidth = window.innerWidth;
    const dialogRef = this.dialog.open(UploadDialogComponent, {
      backdropClass: 'backdrop',
      closeOnNavigation: true,
      autoFocus: false,
      data: {
        collectionId: this.collection.id
      }
    });

    if (this.breakpointIsMatched('480px')) {
      dialogRef.updateSize('88vw');
    } else if (this.breakpointIsMatched('768px')) {
      dialogRef.updateSize('80vw');
    } else if (this.breakpointIsMatched('992px')) {
      dialogRef.updateSize('70vw');
    } else if (this.breakpointIsMatched('1200px')) {
      dialogRef.updateSize('60vw');
    } else if (this.breakpointIsMatched('1201px', 'min')) {
      dialogRef.updateSize('1100px');
    }

    dialogRef.afterClosed().subscribe((isSubmited: boolean) => {
      if (isSubmited) {
        this.uploadService.onSubmitUploadedPhotos(this.collection.id);
      } else if (typeof isSubmited === 'undefined' || false) {
        this.uploadService.onUnsubmit();
      }
    });
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.photoService.cancelSubscription();
    this.collectionService.cancelSubscriptions();
  }
}
