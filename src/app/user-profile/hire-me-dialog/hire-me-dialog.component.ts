import { Component, OnInit, Inject, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogContent } from '@angular/material/dialog';

import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';

interface Data {
  userName: string;
  email: string;
  socialLinks?: {
    website?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
    google?: string;
    tumblr?: string;
  };
}

interface DialogContentDimension {
  width: number;
  height: number;
}

@Component({
  selector: 'ps-hire-me-dialog',
  templateUrl: './hire-me-dialog.component.html',
  styleUrls: ['./hire-me-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HireMeDialogComponent implements OnInit {
  @ViewChild('dialogContent', { static: true }) private dialogContent: MatDialogContent;
  config: PerfectScrollbarConfigInterface = {};
  dialogContentSize: DialogContentDimension;

  constructor(@Inject(MAT_DIALOG_DATA) public data: Data) { }

  ngOnInit() {
    this.dialogContentSize = {
      width: (<ElementRef>this.dialogContent).nativeElement.clientWidth,
      height: (<ElementRef>this.dialogContent).nativeElement.clientHeight
    };
  }

}
