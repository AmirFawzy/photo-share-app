import { Component, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { NgForm, FormControl } from '@angular/forms';
import { MatDialogContent } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';

import { Job } from 'src/app/models/job.model';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { countriesList } from 'src/app/models/countries-list.model';
import { worldCities, Cities } from 'src/app/models/world-cities.model';

interface DialogContentDimension {
  width: number;
  height: number;
}

@Component({
  selector: 'ps-post-job-dialog',
  templateUrl: './post-job-dialog.component.html',
  styleUrls: ['./post-job-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PostJobDialogComponent implements OnInit {
  @ViewChild('dialogContent', { static: true }) private dialogContent: MatDialogContent;
  config: PerfectScrollbarConfigInterface = {};
  dialogContentSize: DialogContentDimension;
  countries = countriesList;
  private worldCities = worldCities;
  cities = [];
  job: Job;
  periods: string[] = ['Full time', 'Part time'];
  periodValue: string;

  constructor() { }

  ngOnInit() {
    this.dialogContentSize = {
      width: (<ElementRef>this.dialogContent).nativeElement.clientWidth,
      height: (<ElementRef>this.dialogContent).nativeElement.clientHeight
    };
  }

  onSubmit(f: NgForm) {
    return;
  }

  /**
   * on select city of the city 'select input'
   *
   * get the select value
   *
   * empty the cities array
   *
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

  // if value less than 1 reset the input
  onInput(evt: Event, control: FormControl) {

    const inp = <HTMLInputElement>evt.target;

    if ((inp.value.length < 2) && (+inp.value < 1)) {
      control.reset();
    }

  }

}
