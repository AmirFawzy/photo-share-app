import { Component, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogContent } from '@angular/material/dialog';

import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';

export interface DialogContentDimension {
  width: number;
  height: number;
}

@Component({
  selector: 'ps-reauthenticate-dialog',
  templateUrl: './reauthenticate-dialog.component.html',
  styleUrls: ['./reauthenticate-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ReauthenticateDialogComponent implements OnInit {
  @ViewChild('dialogContent', { static: true }) private dialogContent: MatDialogContent;
  config: PerfectScrollbarConfigInterface = {};
  dialogContentSize: DialogContentDimension;
  f: FormGroup;

  constructor() {
    this.f = new FormGroup({
      password: new FormControl('', Validators.minLength(8))
    });
  }

  ngOnInit() {
    // get the width and height of the dialog for custom scrollbar
    this.dialogContentSize = {
      width: (<ElementRef>this.dialogContent).nativeElement.clientWidth,
      height: (<ElementRef>this.dialogContent).nativeElement.clientHeight
    };
  }

}
