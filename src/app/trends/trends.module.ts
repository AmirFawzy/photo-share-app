import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TrendsRoutingModule } from './trends-routing.module';
import { MaterialModule } from '../material.module';
import { NgxMasonryModule } from 'ngx-masonry';
import { SharedModule } from '../shared/shared.module';
import { AppPipesModule } from '../pipes/app-pipes.module';
import { TrendsComponent } from './trends.component';
import { MostLikesComponent } from './most-likes/most-likes.component';
import { MostViewsComponent } from './most-views/most-views.component';
import { TopPhotographersComponent } from './top-photographers/top-photographers.component';


@NgModule({
  declarations: [
    TrendsComponent,
    MostLikesComponent,
    MostViewsComponent,
    TopPhotographersComponent
  ],
  exports: [
    TrendsComponent,
    MostLikesComponent,
    MostViewsComponent,
    TopPhotographersComponent
  ],
  imports: [
    CommonModule,
    TrendsRoutingModule,
    MaterialModule,
    NgxMasonryModule,
    SharedModule,
    AppPipesModule
  ]
})
export class TrendsModule { }
