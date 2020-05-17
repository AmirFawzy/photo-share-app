import { Component, OnInit, Inject, ViewEncapsulation, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogContent } from '@angular/material/dialog';
import { MatSelectionList, MatSelectionListChange, MatListOption } from '@angular/material/list';
import { Subscription } from 'rxjs';

import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { Collection } from 'src/app/models/collection.model';
import { CollectionService } from 'src/app/services/collection.service';
import { UiService } from 'src/app/services/ui.service';

@Component({
  selector: 'ps-add-to-collection-dialog',
  templateUrl: './add-to-collection-dialog.component.html',
  styleUrls: ['./add-to-collection-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AddToCollectionDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('collectionList', { static: false }) readonly collectionOptionsList: MatSelectionList;
  @ViewChild('dialogContent', { static: true }) readonly dialogContent: MatDialogContent;
  dialogWidth: number;
  selectedCollections = [];
  unselectedCollections = [];
  config: PerfectScrollbarConfigInterface = {};
  loadingState = false;
  collections: Collection[];
  private subscriptions: Subscription[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { photoId: string, userId: string },
    private colelctionService: CollectionService,
    private uiService: UiService
  ) { }

  ngOnInit() {
    this.dialogWidth = (<ElementRef>this.dialogContent).nativeElement.clientWidth;

    this.colelctionService.getUserCollections(this.data.userId, 'dialog');

    this.subscriptions.push(this.uiService.dialogLoadingState.subscribe(
      state => this.loadingState = state
    ));

    this.subscriptions.push(this.colelctionService.collections$.subscribe(
      collections => {

        this.collections = collections;

        this.collections.forEach(collection => {

          collection.photos.forEach(id => {

            if ((id === this.data.photoId) && (!this.selectedCollections.includes(collection.id))) {
              this.selectedCollections.push(collection.id);
            }

          });

        });

      }
    ));
  }

  ngAfterViewInit() {
    // Itreate on all selection options if select option is selected
    // push it value (collection id) to selectedCollections[]
    if (this.collections) {

      this.collectionOptionsList.options.forEach((selectOpt: MatListOption) => {

        if (selectOpt.selected) {
          this.selectedCollections.push(selectOpt.value);
        }

      });

    }
  }

  /**
   *On add new collection
   *
   * @param {NgForm} form form object
   * @memberof AddToCollectionDialogComponent
   * @method `addNewCollection` excute to add new collection to db then reset the form
   */
  onAddCollection(form: NgForm) {

    if (form.value) {

      this.colelctionService.addNewCollection(<string>form.value.collectionTitle);
      form.reset();

    }

  }

  /**
   *On selecte change
   *
   * @param {MatSelectionListChange} evt selecte event
   * @memberof AddToCollectionDialogComponent
   * @constant selectedVal value just selected
   *
   ** truthy -- add selectedVal (collection id) to `selectedCollections`
   * then loop over `unselectedCollections` and if true -- remove the id from `unselectedCollections`
   *
   ** falsy -- truthy -- add selectedVal (collection id) to `unselectedCollections`
   * then loop over `selectedCollections` and if true -- remove the id from `selectedCollections`
   */
  onSelectionChange(evt: MatSelectionListChange) {

    const selectedVal = evt.option.value;

    if (evt.option.selected) {

      this.selectedCollections.push(selectedVal);

      this.unselectedCollections.forEach((id: string, idx: number) => {

        if (id === selectedVal) {
          this.unselectedCollections.splice(idx, 1);
        }

      });

    } else {

      this.unselectedCollections.push(selectedVal);

      this.selectedCollections.forEach((id: string, idx: number) => {

        if (id === selectedVal) {
          this.selectedCollections.splice(idx, 1);
        }

      });

    }

  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.colelctionService.cancelSubscriptions();
  }

}
