import { Component, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { MatDialogContent } from '@angular/material/dialog';

import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { UserService } from '../../services/user.service';
import { UiService } from '../../services/ui.service';

interface DialogContentDimension {
  width: number;
  height: number;
}

@Component({
  selector: 'ps-upload-user-photo-dialog',
  templateUrl: './upload-user-photo-dialog.component.html',
  styleUrls: ['./upload-user-photo-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class UploadUserPhotoDialogComponent implements OnInit {
  @ViewChild('dialogContent', { static: true }) private dialogContent: MatDialogContent;
  config: PerfectScrollbarConfigInterface = {};
  dialogContentSize: DialogContentDimension;
  userPhoto: string;

  constructor(
    public userService: UserService,
    public uiService: UiService
  ) { }

  ngOnInit() {
    this.userService.getUserAccountSettings();

    this.dialogContentSize = {
      width: (<ElementRef>this.dialogContent).nativeElement.clientWidth,
      height: (<ElementRef>this.dialogContent).nativeElement.clientHeight
    };
  }

  onUpdateUserPhoto(evt: Event) {

    const file = (<HTMLInputElement>evt.srcElement).files[0];

    if (file) {
      this.userService.updateUserPhoto(file);
    }

  }

}
