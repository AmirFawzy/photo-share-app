import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MaterialModule } from '../material.module';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { UserComponent } from './user/user.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { MoreComponent } from './more/more.component';

@NgModule({
  declarations: [
    UserComponent,
    NotificationsComponent,
    MoreComponent
  ],
  exports: [
    UserComponent,
    NotificationsComponent,
    MoreComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    PerfectScrollbarModule
  ]
})
export class UserNavsModule { }
