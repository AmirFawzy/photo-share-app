import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { AccountRoutingModule } from './account-routing.module';
import { MaterialModule } from '../material.module';
import { FontIconsModule } from '../shared/font-icons.module';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { AccountComponent } from './account.component';
import { DeleteComponent } from './delete/delete.component';
import { ConfirmDeleteAccountDialogComponent } from './delete/confirm-delete-account-dialog/confirm-delete-account-dialog.component';
import { FollowersComponent } from './followers/followers.component';
import { NewsletterComponent } from './newsletter/newsletter.component';
import { NotificationsAccComponent } from './notifications/notifications.component';
import { SettingsComponent } from './settings/settings.component';
import { UploadUserPhotoDialogComponent } from './upload-user-photo-dialog/upload-user-photo-dialog.component';


@NgModule({
  declarations: [
    AccountComponent,
    DeleteComponent,
    ConfirmDeleteAccountDialogComponent,
    FollowersComponent,
    NewsletterComponent,
    NotificationsAccComponent,
    SettingsComponent,
    UploadUserPhotoDialogComponent
  ],
  exports: [
    AccountComponent,
    DeleteComponent,
    ConfirmDeleteAccountDialogComponent,
    FollowersComponent,
    NewsletterComponent,
    NotificationsAccComponent,
    SettingsComponent,
    UploadUserPhotoDialogComponent
  ],
  imports: [
    CommonModule,
    AccountRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    FontIconsModule,
    MaterialModule,
    PerfectScrollbarModule
  ],
  entryComponents: [
    ConfirmDeleteAccountDialogComponent,
    UploadUserPhotoDialogComponent
  ]
})
export class AccountModule { }
