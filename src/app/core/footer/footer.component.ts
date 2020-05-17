import { Component, OnInit } from '@angular/core';
import { take } from 'rxjs/operators';

import { TrendsService, GeneralDataWithUID } from 'src/app/services/trends.service';

@Component({
  selector: 'ps-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  topUsers: GeneralDataWithUID[];

  constructor(private trendsService: TrendsService) { }

  ngOnInit() {
    this.trendsService.getTopPhotographers()
      .pipe(take(5))
      .subscribe(
        topPhotographers => this.topUsers = topPhotographers
      );
  }

}
