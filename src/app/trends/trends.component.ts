import { Component, OnInit, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';

@Component({
  selector: 'ps-trends',
  templateUrl: './trends.component.html',
  styleUrls: ['./trends.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TrendsComponent implements OnInit {
  isLikesTab = false;
  isViewsTab = false;

  constructor(private cdRef: ChangeDetectorRef) { }

  ngOnInit() {
  }

  selectedTabChanged(evt: MatTabChangeEvent) {
    switch (evt.index) {
      case 0:
        this.isLikesTab = false;
        this.isViewsTab = false;
        this.cdRef.detectChanges();
        break;
      case 1:
        this.isViewsTab = true;
        this.isLikesTab = false;
        this.cdRef.detectChanges();
        break;
      case 2:
        this.isLikesTab = true;
        this.isViewsTab = false;
        this.cdRef.detectChanges();
        break;
      default:
        this.isViewsTab = false;
        this.isLikesTab = false;
        this.cdRef.detectChanges();
        break;
    }
  }
}
