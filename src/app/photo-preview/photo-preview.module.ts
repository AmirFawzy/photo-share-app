import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LayoutModule } from '@angular/cdk/layout';

import { PhotoPreviewRoutingModule } from './photo-preview-routing.module';
import { MaterialModule } from '../material.module';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { AppPipesModule } from '../pipes/app-pipes.module';
import { AppDirectivesModule } from '../directives/app-directives.module';
import { ShareModule } from '@ngx-share/core';
import { SharedModule } from '../shared/shared.module';
import { NgxMasonryModule } from 'ngx-masonry';
import { FontIconsModule } from '../shared/font-icons.module';
import { PhotoPreviewComponent } from './photo-preview.component';
import { PhotoComponent } from './photo/photo.component';
import { AddToCollectionDialogComponent } from './photo/add-to-collection-dialog/add-to-collection-dialog.component';
import { PhotoDeleteDialogComponent } from './photo/photo-delete-dialog/photo-delete-dialog.component';
import { PhotoEditDialogComponent } from './photo/photo-edit-dialog/photo-edit-dialog.component';
import { ShareBtnsDialogComponent } from './photo/share-btns-dialog/share-btns-dialog.component';
import { DetailsComponent } from './details/details.component';
import { CommentsComponent } from './comments/comments.component';


@NgModule({
  declarations: [
    PhotoPreviewComponent,
    PhotoComponent,
    AddToCollectionDialogComponent,
    PhotoDeleteDialogComponent,
    PhotoEditDialogComponent,
    ShareBtnsDialogComponent,
    DetailsComponent,
    CommentsComponent
  ],
  exports: [
    PhotoPreviewComponent,
    PhotoComponent,
    AddToCollectionDialogComponent,
    PhotoDeleteDialogComponent,
    PhotoEditDialogComponent,
    ShareBtnsDialogComponent,
    DetailsComponent,
    CommentsComponent
  ],
  imports: [
    CommonModule,
    PhotoPreviewRoutingModule,
    RouterModule,
    FormsModule,
    LayoutModule,
    MaterialModule,
    PerfectScrollbarModule,
    NgxMasonryModule,
    AppPipesModule,
    AppDirectivesModule,
    ShareModule,
    SharedModule,
    FontIconsModule
  ],
  entryComponents: [
    AddToCollectionDialogComponent,
    PhotoDeleteDialogComponent,
    PhotoEditDialogComponent,
    ShareBtnsDialogComponent
  ]
})
export class PhotoPreviewModule { }
