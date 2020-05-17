import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { SearchRoutingModule } from './search-routing.module';
import { MaterialModule } from '../material.module';
import { NgxMasonryModule } from 'ngx-masonry';
import { SharedModule } from '../shared/shared.module';
import { SearchComponent } from './search.component';

@NgModule({
  declarations: [SearchComponent],
  exports: [SearchComponent],
  imports: [
    CommonModule,
    SearchRoutingModule,
    RouterModule,
    MaterialModule,
    NgxMasonryModule,
    SharedModule
  ]
})
export class SearchModule { }
