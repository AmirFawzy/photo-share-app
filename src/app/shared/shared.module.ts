import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MaterialModule } from '../material.module';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { FontIconsModule } from './font-icons.module';
import { ReauthenticateDialogComponent } from './reauthenticate-dialog/reauthenticate-dialog.component';
import { PhotoCardComponent } from './photo-card/photo-card.component';
import { LoginComponent } from './login/login.component';

@NgModule({
  declarations: [
    ReauthenticateDialogComponent,
    PhotoCardComponent,
    LoginComponent
  ],
  exports: [
    ReauthenticateDialogComponent,
    PhotoCardComponent,
    LoginComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MaterialModule,
    PerfectScrollbarModule,
    FontIconsModule
  ],
  entryComponents: [
    ReauthenticateDialogComponent,
    LoginComponent
  ]
})
export class SharedModule { }
