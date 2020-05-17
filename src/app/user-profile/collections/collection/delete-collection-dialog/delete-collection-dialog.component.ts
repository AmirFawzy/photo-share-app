import { Component, OnInit, ViewChild, Inject, ElementRef, ViewEncapsulation } from '@angular/core';
import { MatDialogContent, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';

interface DialogContentDimension {
  width: number;
  height: number;
}

interface Data {
  collectionTitle: string;
}

@Component({
  selector: 'ps-delete-collection-dialog',
  templateUrl: './delete-collection-dialog.component.html',
  styleUrls: ['./delete-collection-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DeleteCollectionDialogComponent implements OnInit {
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
