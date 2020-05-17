import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LayoutModule } from '@angular/cdk/layout';

import { MaterialModule } from '../material.module';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { UploadDialogComponent } from './upload-dialog.component';
import { UploadTaskComponent } from './upload-task/upload-task.component';

@NgModule({
  declarations: [
    UploadDialogComponent,
    UploadTaskComponent
  ],
  exports: [
    UploadDialogComponent,
    UploadTaskComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    PerfectScrollbarModule,
    LayoutModule
  ],
  entryComponents: [UploadDialogComponent]
})
export class UploadDialogModule { }
