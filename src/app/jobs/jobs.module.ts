import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LayoutModule } from '@angular/cdk/layout';

import { JobsRoutingModule } from './jobs-routing.module';
import { MaterialModule } from '../material.module';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { SearchJobComponent } from './search/search-job.component';
import { JobDetailsComponent } from './job-details/job-details.component';
import { PostJobDialogComponent } from './search/post-job-dialog/post-job-dialog.component';

@NgModule({
  declarations: [
    SearchJobComponent,
    JobDetailsComponent,
    PostJobDialogComponent
  ],
  exports: [
    SearchJobComponent,
    JobDetailsComponent,
    PostJobDialogComponent
  ],
  imports: [
    CommonModule,
    JobsRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    PerfectScrollbarModule,
    LayoutModule
  ],
  entryComponents: [PostJobDialogComponent]
})
export class JobsModule { }
