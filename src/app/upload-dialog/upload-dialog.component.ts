import { Component, OnInit, ViewChild, ElementRef, ViewEncapsulation, OnDestroy, DoCheck, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { BreakpointObserver } from '@angular/cdk/layout';
import { trigger, transition, useAnimation } from '@angular/animations';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AngularFireAuth } from '@angular/fire/auth';
import { MatCheckboxChange, MatCheckbox } from '@angular/material/checkbox';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialogContent, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { Photo } from '../models/photo.model';
import { countriesList, CountriesList } from '../models/countries-list.model';
import { worldCities, Cities } from '../models/world-cities.model';
import { fadingAnimation } from '../animations/fading-animation';
import { UploadService } from '../services/upload.service';
import { UiService } from '../services/ui.service';
import { Collection } from '../models/collection.model';
import { CollectionService } from '../services/collection.service';
import { take } from 'rxjs/operators';

interface ElementDimension {
  width: number;
  height: number;
}

interface PhotoFile extends File {
  bolbLink: SafeUrl;
  fakeId: string;
}

@Component({
  selector: 'ps-upload-dialog',
  templateUrl: './upload-dialog.component.html',
  styleUrls: ['./upload-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('showHideFormContainer', [
      transition(':enter', [
        useAnimation(fadingAnimation, {
          params: {
            opacityStart: 0,
            time: '1s',
            opacityAnimate: 1
          }
        })
      ]),
      transition(':leave', [
        useAnimation(fadingAnimation, {
          params: {
            opacityStart: 1,
            time: '1s',
            opacityAnimate: 0
          }
        })
      ])
    ]),
    trigger('showHideForm', [
      transition(':enter', [
        useAnimation(fadingAnimation, {
          params: {
            opacityStart: 0,
            time: '300ms',
            opacityAnimate: 1
          }
        })
      ]),
      transition(':leave', [
        useAnimation(fadingAnimation, {
          params: {
            opacityStart: 1,
            time: '300ms',
            opacityAnimate: 0
          }
        })
      ])
    ])
  ]
})
export class UploadDialogComponent implements OnInit, OnDestroy, DoCheck {
  @ViewChild('dialogContent', { static: true }) private readonly dialogContent: MatDialogContent;
  @ViewChild('uploadPhotoContainer', { static: true }) private readonly uploadPhotoContainer: ElementRef;
  @ViewChild('fileInput', { static: false }) private readonly fileInput: ElementRef;
  readonly config: PerfectScrollbarConfigInterface = {};
  private dialogContentSize: ElementDimension;
  private uploadPhotoContainerSize: ElementDimension;
  selectedPhoto: Photo[] = [];
  selectedPhotoAfterOnSave: string;
  editForm: FormGroup;
  readonly countries = countriesList;
  private worldCities = worldCities;
  cities: string[] = [];
  isLocationExist = false;
  isHovered: boolean;
  files: PhotoFile[] = [];
  receivedPhotos: Photo[] = [];
  loadingState = false;
  collections: Collection[];
  private subscriptions: Subscription = new Subscription();
  disableSubmit = false;
  disableCollectionsSelectInput = false;
  tabletScreenDown = false;
  mobileScreenDown = false;

  constructor(
    private fb: FormBuilder,
    public sanitizer: DomSanitizer,
    public uploadService: UploadService,
    public uiService: UiService,
    private collectionService: CollectionService,
    private afAuth: AngularFireAuth,
    private breakpointObserver: BreakpointObserver,
    private snackbar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { collectionId: string }
  ) {
    this.editForm = this.fb.group({
      photoTitle: ['', Validators.required],
      keywords: [''],
      description: [''],
      countries: [''],
      cities: [{ value: '', disabled: this.isLocationExist }],
      nodity: [false],
      collections: ['']
    });
  }

  ngOnInit() {
    this.countries.sort(this.sortByAlphabet);

    // dialog size height & width
    this.dialogContentSize = {
      width: (<ElementRef>this.dialogContent).nativeElement.clientWidth,
      height: (<ElementRef>this.dialogContent).nativeElement.clientHeight
    };

    // uploaded photo container height & width
    this.uploadPhotoContainerSize = {
      width: this.uploadPhotoContainer.nativeElement.clientWidth,
      height: this.uploadPhotoContainer.nativeElement.clientHeight
    };

    // subscribe for files fetched from db to @this receivedPhotos
    this.subscriptions.add(this.uploadService.fetchedFiles$.subscribe(
      (photos: Photo[]) => this.receivedPhotos = photos
    ));

    this.subscriptions.add(this.uploadService.fetchedFiles$
      .pipe(take(1))
      .subscribe(() => {

        if (this.receivedPhotos.length && (this.tabletScreenDown || this.mobileScreenDown)) {

          this.snackbar.open('You can edit any photo by opening the photo then edit button', 'X', {
            verticalPosition: 'top',
            panelClass: 'photo-share-snackbar'
          });

        }

      }));

    // subscribe for dialog loading state to @this loadingState
    this.subscriptions.add(this.uiService.dialogLoadingState.subscribe(
      (state: boolean) => this.loadingState = state
    ));

    // subscribe for authstate to get userId and get user collections
    this.subscriptions.add(this.afAuth.authState.subscribe(user => {
      if (user) {
        const userId = user.uid;
        this.collectionService.getUserCollections(userId, 'no loading');
      }
    }));

    // subscribe for user collections if there's any
    this.subscriptions.add(this.collectionService.collections$.subscribe(
      collections => {
        this.collections = collections;

        if (this.data.collectionId && this.collections.length) {

          this.editForm.patchValue({
            collections: [this.data.collectionId]
          });

          this.disableCollectionsSelectInput = true;

        }
      }
    ));

    // subscribe for breakpoint changing
    this.subscriptions.add(this.breakpointObserver
      .observe(['(max-width: 768px) and (min-width: 567.1px)', '(max-width: 567px)'])
      .subscribe(state => {

        if (state.breakpoints['(max-width: 768px) and (min-width: 567.1px)']) {

          this.tabletScreenDown = true;
          this.mobileScreenDown = false;

        } else if (state.breakpoints['(max-width: 567px)']) {

          this.mobileScreenDown = true;
          this.tabletScreenDown = false;

        } else {

          this.tabletScreenDown = false;
          this.mobileScreenDown = false;

        }

      }));
  }

  ngDoCheck() {
    /**
     * @if true loop on [this.selectedPhoto]
     * @param photo <Photo> the photo object
     * set [this.selectedPhotoAfterOnSave] to the id of this photo
     *
     * all that for to recheck the selected photo after excute [onSave()] to keep selected photo selected
     */
    if (this.selectedPhoto.length === 1) {

      this.selectedPhoto.forEach((photo: Photo) => {
        this.selectedPhotoAfterOnSave = photo.id;
      });

    }
  }

  /**
   *On drop files
   *
   * @param {FileList} files the files list arr holds all files choosed by user to upload
   * @memberof UploadDialogComponent
   * @loop on [files] and push new object to `files`
   *
   * merge the file item in the [files] array with new two proerty
   *
   * @property {string} bolbLink holds the link of the file to localy to show the photo placeholder
   *
   * angular block any url untrusted To mark a value as trusted use [sanitizer]
   *
   * @property {string} fakeId fake id for the file to manage the sequence of the files/photos
   *
   * in the uploadDialog until add it all in the final place in database
   */
  onFilesDrop(files: FileList) {

    for (let i = 0; i < files.length; i++) {

      this.files.push(Object.assign(files.item(i), {
        bolbLink: this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(files[i])),
        fakeId: `${this.files.length + 1}`
      }));

    }

  }

  // control the ui when the user drageover the upload area/dropzone
  onHover(hoverState: boolean) {
    this.isHovered = hoverState;
  }

  /**
   * on done uploading or canceled
   * @param fileFakeId <string> the fake id of the file
   * @loop on [this.files] <FileList>
   * @if true remove this file from [this.files] and reset the file input
   * @if true await until loop on [this.selectedPhoto] <array> done
   * excute [onUpdatePhoto()] <method> to update the data of selected photo in db
   * delete all items in [this.selectedPhoto]
   * fetch the new uploade photos from db by excute [getUploadedFilesFromFakePath()]
   * set [this.selectedPhotoAfterOnSave] to null (reset the value) after fetch new files
   */
  async onUploadDoneOrCancel(fileFakeId: string) {
    this.files.forEach((file, idx: number) => {

      if (file.fakeId === fileFakeId) {

        this.files.splice(idx, 1);
        (<HTMLInputElement>this.fileInput.nativeElement).value = '';

      }

    });

    if (this.selectedPhoto.length === 1) {

      await this.selectedPhoto.forEach(async (photo: Photo) => {

        await this.uploadService.onUpdatePhoto(Object.assign({}, { ...photo }, {
          title: this.getControlerValueEditForm<string>('photoTitle'),
          // tslint:disable-next-line:max-line-length
          keywords: this.getControlerValueEditForm<string[]>('keywords') ? this.getControlerValueEditForm<string[]>('keywords') : photo.keywords,
          description: this.getControlerValueEditForm<string>('description'),
          location: this.getControlerValueEditForm<string>('countries'),
          locationDetails: this.getControlerValueEditForm<string>('cities'),
          isNodity: this.getControlerValueEditForm<boolean>('nodity'),
          collections: this.getControlerValueEditForm<string[]>('collections')
        }));

      });

    }

    this.selectedPhoto.splice(0);
    this.uploadService.getUploadedFilesFromFakePath();
    this.selectedPhotoAfterOnSave = null;
  }

  // to get photo form controler by control name
  private getControlerValueEditForm<T>(controlerName: string): T {
    return this.editForm.get(controlerName).value;
  }

  /**
   * on photo select to edit
   * @param evt [@description MatCheckboxChange]
   * @const checkedPhotoId [@description MatCheckbox] the value of the checkbox is the 'photoId'
   * @const isChecked boolean if photo selected or not
   *
   * @if true @loop on @this receivedPhotos
   * @if true add @param photo <object> to @this selectedPhoto
   *
   * @elseIf false @loop on @this selectedPhoto @param photo in photo <object> @param idx is the index
   * @if true remove [photo] <object> from @this selectedPhoto
   *
   * @if true patch the value of @this editForm
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

      this.receivedPhotos.forEach((photo: Photo) => {

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

      this.editForm.patchValue({
        photoTitle: this.selectedPhoto[0].title,
        description: this.selectedPhoto[0].description,
        countries: this.selectedPhoto[0].location,
        cities: this.selectedPhoto[0].locationDetails,
        nodity: this.selectedPhoto[0].isNodity,
        camera: this.selectedPhoto[0].camera.model,
      });

      // get the cities of the country
      if (this.getControlerValueEditForm<string>('countries')) {

        this.worldCities.forEach((city: Cities) => {

          const selectedPhotoLocation = this.selectedPhoto[0].location.toLowerCase();

          if (city.country.toLowerCase() === selectedPhotoLocation) {

            this.cities.push(city.name);
            this.cities.sort();

          }

        });

      }

      if (this.getControlerValueEditForm<string>('countries').length > 0) {

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
   * @param photo the photo object in @this receivedPhotos
   * @param idx is the index of [photo] object in the array
   * @if true remove photo from @this receivedPhotos
   * remove [photo] object form the @this selectedPhoto
   * @this onDeletePhoto repeate excution until @if false
   *
   * on delete photo loop on @this selectedPhoto
   * @param photo <Photo> the selected photo in @this selectedPhoto
   * excute [onDeletePhoto()] <method> form @this uploadService
   * remove [photo] object form the @this selectedPhoto
   * important for hide or show the form input
   */
  onDeletePhoto() {

    this.selectedPhoto.forEach((photo: Photo, idx: number) => {

      this.uploadService.onDeletePhoto(photo);
      this.selectedPhoto.splice(idx, 1);
      this.onDeletePhoto();

    });

  }

  /**
   * on remove one of Photo (keywords)
   * @param chipValue value received from event (keyword)
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
   * @param evt the received event from adding event
   * @const value the value received from event
   * add [value] to @array keywords in @this selectedPhoto[0]
   * reset keywords input
   */
  onAddPhotoChip(evt: MatChipInputEvent): void {

    const value = evt.value;

    if ((value || '').trim()) {
      this.selectedPhoto[0].keywords.push(value.toLowerCase().trim());
    }

    this.editForm.get('keywords').reset();
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

    if (this.getControlerValueEditForm<string>('countries').length > 0) {

      this.isLocationExist = true;

    } else {

      this.isLocationExist = false;

    }

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

  /**
   * on edit photo and save
   * @if true @loop over @this selectedPhoto @param photo <Photo> the photo object
   * excute [onUpdatePhoto()] in [this.uploadService] and 'merge' objects in one object with edited properties
   */
  onSave() {

    if (this.selectedPhoto.length === 1) {

      this.selectedPhoto.forEach((photo: Photo) => {

        this.disableSubmit = true;

        this.uploadService.onUpdatePhoto(Object.assign({}, { ...photo }, {
          title: this.getControlerValueEditForm<string>('photoTitle'),
          // tslint:disable-next-line:max-line-length
          keywords: this.getControlerValueEditForm<string[]>('keywords') ? this.getControlerValueEditForm<string[]>('keywords') : photo.keywords,
          description: this.getControlerValueEditForm<string>('description'),
          location: this.getControlerValueEditForm<string>('countries'),
          locationDetails: this.getControlerValueEditForm<string>('cities'),
          isNodity: this.getControlerValueEditForm<boolean>('nodity'),
          collections: this.getControlerValueEditForm<string[]>('collections')
        }))
          .finally(() => {
            setTimeout(() => {
              this.disableSubmit = false;
            }, 5000);
          });

      });

    }

  }

  ngOnDestroy() {
    this.uploadService.cancelSubscription();
    this.collectionService.cancelSubscriptions();
    this.subscriptions.unsubscribe();
  }
}
