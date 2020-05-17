import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { ShareService } from '@ngx-share/core';

@Component({
  selector: 'ps-share-btns-dialog',
  templateUrl: './share-btns-dialog.component.html',
  styleUrls: ['./share-btns-dialog.component.scss']
})
export class ShareBtnsDialogComponent implements OnInit {

  constructor(public share: ShareService, @Inject(MAT_DIALOG_DATA) public data: {url: string}) { }

  ngOnInit() {
  }

}
