import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UserProfileResolverService } from './user-profile.resolver.service';
import { CollectionComponent } from './collections/collection/collection.component';
import { UserProfileComponent } from './user-profile.component';
import { AuthGuard } from '../register-password/auth.guard';


const routes: Routes = [
  {
    path: '',
    component: UserProfileComponent,
    resolve: { user: UserProfileResolverService }
  },
  {
    path: 'collection/:name',
    component: CollectionComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserProfileRoutingModule { }
