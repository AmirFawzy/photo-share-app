import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LayoutModule } from '@angular/cdk/layout';

import { UserProfileRoutingModule } from './user-profile-routing.module';
import { MaterialModule } from '../material.module';
import { NgxMasonryModule } from 'ngx-masonry';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { FontIconsModule } from '../shared/font-icons.module';
import { AppPipesModule } from '../pipes/app-pipes.module';
import { SharedModule } from '../shared/shared.module';
import { UploadDialogModule } from '../upload-dialog/upload-dialog.module';
import { UserProfileComponent } from './user-profile.component';
import { PhotosComponent } from './photos/photos.component';
import { HireMeDialogComponent } from './hire-me-dialog/hire-me-dialog.component';
import { CollectionsComponent } from './collections/collections.component';
import { CollectionComponent } from './collections/collection/collection.component';
import { DeleteCollectionDialogComponent } from './collections/collection/delete-collection-dialog/delete-collection-dialog.component';


@NgModule({
  declarations: [
    UserProfileComponent,
    PhotosComponent,
    HireMeDialogComponent,
    CollectionsComponent,
    CollectionComponent,
    DeleteCollectionDialogComponent
  ],
  exports: [
    UserProfileComponent,
    PhotosComponent,
    HireMeDialogComponent,
    CollectionsComponent,
    CollectionComponent,
    DeleteCollectionDialogComponent
  ],
  imports: [
    CommonModule,
    UserProfileRoutingModule,
    MaterialModule,
    ReactiveFormsModule,
    SharedModule,
    LayoutModule,
    NgxMasonryModule,
    PerfectScrollbarModule,
    FontIconsModule,
    AppPipesModule,
    UploadDialogModule
  ],
  entryComponents: [
    HireMeDialogComponent,
    DeleteCollectionDialogComponent
  ]
})
export class UserProfileModule { }
