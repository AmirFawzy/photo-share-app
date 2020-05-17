import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SettingsComponent } from './settings/settings.component';
import { FollowersComponent } from './followers/followers.component';
import { NotificationsAccComponent } from './notifications/notifications.component';
import { NewsletterComponent } from './newsletter/newsletter.component';
import { DeleteComponent } from './delete/delete.component';


const routes: Routes = [
  { path: 'settings', component: SettingsComponent },
  { path: 'followers', component: FollowersComponent },
  { path: 'notifications', component: NotificationsAccComponent },
  { path: 'newsletter', component: NewsletterComponent },
  { path: 'delete-account', component: DeleteComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountRoutingModule { }
