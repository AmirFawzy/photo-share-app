import { Component, Inject, OnInit, ViewChild, ViewEncapsulation, ElementRef, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatChipInputEvent, MatChipList } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogContent } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { Subscription } from 'rxjs';

import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { Photo } from 'src/app/models/photo.model';
import { Cities, worldCities } from 'src/app/models/world-cities.model';
import { CountriesList, countriesList } from 'src/app/models/countries-list.model';
import { Software } from 'src/app/models/software.model';

export interface DialogContentDimension {
  width: number;
  height: number;
}

interface OtherValues {
  keywords: string[];
  tools: string[];
  software: Software[] | string[];
}

@Component({
  selector: 'ps-photo-edit-dialog',
  templateUrl: './photo-edit-dialog.component.html',
  styleUrls: ['./photo-edit-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PhotoEditDialogComponent implements OnInit, OnDestroy {
  @ViewChild('f', { static: true }) private form: NgForm;
  @ViewChild('dialogContent', { static: true }) private dialogContent: MatDialogContent;
  @ViewChild('keywordsList', { static: false }) private keywordsList: MatChipList;
  photo: Photo;
  countries = countriesList;
  private worldCities = worldCities;
  cities = [];
  config: PerfectScrollbarConfigInterface = {};
  dialogContentSize: DialogContentDimension;
  otherValues: OtherValues;
  aboveTabletScreen = false;  // breakpoint 769px and up
  tabletScreenDown = false;   // breakpoint 768px and down
  private subscriptions: Subscription = new Subscription();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { photo: Photo },
    private breakpointService: BreakpointObserver
  ) { }

  ngOnInit() {
    this.photo = this.data.photo;

    this.countries.sort(this.sortByAlphabet);

    // get the width and height of the dialog for custom scrollbar
    this.dialogContentSize = {
      width: (<ElementRef>this.dialogContent).nativeElement.clientWidth,
      height: (<ElementRef>this.dialogContent).nativeElement.clientHeight
    };

    // get hte cities of the country then push every city in the 'cities' property for city 'select input'
    this.worldCities.forEach((city: Cities) => {

      if (city.country.toLowerCase() === this.photo.location.toLowerCase()) {

        this.cities.push(city.name);
        this.cities.sort();

      }

    });

    // set the value of the dialog form
    setTimeout(() => {

      this.form.setValue({
        'title': this.photo.title,
        'description': this.photo.description ? this.photo.description : '',
        'countries': this.photo.location,
        'cities': this.photo.locationDetails ? this.photo.locationDetails : '',
        'nodity': this.photo.isNodity,
        'camera': this.photo.camera.model,
      });

    }, 100);

    this.otherValues = {
      keywords: this.photo.keywords,
      software: this.photo.software,
      tools: this.photo.tools
    };

    this.subscriptions.add(this.breakpointService
      .observe(['(max-width: 768px)', '(min-width: 769px)'])
      .subscribe(breakpoint => {

        if (breakpoint.breakpoints['(max-width: 768px)']) {

          this.tabletScreenDown = true;
          this.aboveTabletScreen = false;

        } else if (breakpoint.breakpoints['(min-width: 769px)']) {

          this.aboveTabletScreen = true;
          this.tabletScreenDown = false;

        } else {

          this.aboveTabletScreen = false;
          this.tabletScreenDown = false;

        }

      }));
  }


  onSubmit(form: NgForm) {
    return;
  }

  /**
   * on select city of the city 'select input'
   * get the select value
   * empty the cities array
   * if 'select input' value match the country, get all cities of that country
  */
  onSelectionChange(evt: MatSelectChange) {

    const selectVal = evt.value.toLowerCase();
    this.cities = [];

    this.worldCities.forEach((city: Cities) => {

      if (selectVal === city.country.toLowerCase()) {

        this.cities.push(city.name);
        this.cities.sort();

      }

    });

  }

  /**
   * on add keyword get chip value
   * if there's a value get the keyword array of the photo
   * push chip value to keywords array of this photo being edit
  */
  onAddKeyword(evt: MatChipInputEvent) {

    const val = evt.value;

    if ((val || '').trim()) {
      this.photo.keywords.push(val.trim().toLowerCase());
    }
    evt.input.value = '';

    if (this.photo.keywords.length > 0) {
      this.keywordsList.errorState = false;
    }

  }

  /**
   * on remove keyword get the 'idx' index of the current keyword
   * remove this keyword from keyworlds array
   * and in case the kewyword less than 1 character show error to user
  */
  onRemoveKeyword(idx: number) {

    this.photo.keywords.splice(idx, 1);

    if (this.photo.keywords.length < 1) {
      this.keywordsList.errorState = true;
    }

  }

  /**
   * on add software get chip value
   * if there's a value get the software array of the photo
   * push chip value to software array of this photo being edit
  */
  onAddSoftware(evt: MatChipInputEvent) {

    const val = evt.value;

    if ((val || '').trim()) {
      (<string[]>this.photo.software).push(val.toLowerCase());
    }

    evt.input.value = '';

  }

  /**
   * on remove software get the 'idx' index of the current software
   * remove this software from software array
  */
  onRemoveSoftware(idx: number) {
    this.photo.software.splice(idx, 1);
  }

  /**
  * on add tool get chip value
  * if there's a value get the tools array of the photo
  * push chip value to tools array of this photo being edit
 */
  onAddTool(evt: MatChipInputEvent) {

    const val = evt.value;

    if ((val || '').trim()) {
      this.photo.tools.push(val.toLowerCase());
    }

    evt.input.value = '';

  }

  /**
   * on remove tool get the 'idx' index of the current tool
   * remove this tool from tool array
  */
  onRemoveTool(idx: number) {
    this.photo.tools.splice(idx, 1);
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

  ngOnDestroy() {

  }
}
