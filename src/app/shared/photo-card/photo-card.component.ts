import { Component, OnInit, Input } from '@angular/core';

import { Photo } from '../../models/photo.model';

interface PhotoDefinition extends Photo {
  thumbnails: {
    thum500: {
      downloadUrl: string;
      storagePath: string;
    }
  };
}

@Component({
  selector: 'ps-photo-card',
  templateUrl: './photo-card.component.html',
  styleUrls: ['./photo-card.component.scss']
})
export class PhotoCardComponent implements OnInit {
  @Input() photo: PhotoDefinition;

  constructor() { }

  ngOnInit() {
  }

}
