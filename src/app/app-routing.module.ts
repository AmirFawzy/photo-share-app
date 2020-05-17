import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './core/home/home.component';
import { RegisterComponent } from './register-password/register/register.component';
import { RecoverPasswordComponent } from './register-password/recover-password/recover-password.component';
import { AccountComponent } from './account/account.component';
import { AuthGuard } from './register-password/auth.guard';

const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full', data: { animation: 'HomePage' } },
  { path: 'register', component: RegisterComponent, data: { animation: 'RegisterPage' } },
  { path: 'password-recover', component: RecoverPasswordComponent, data: { animation: 'PassRecoverPage' } },
  {
    path: 'search/:keyword',
    loadChildren: () => import('./search/search.module').then(mod => mod.SearchModule),
    data: { animation: 'SearchPage' }
  },
  {
    path: 'trends',
    loadChildren: () => import('./trends/trends.module').then(mod => mod.TrendsModule),
    data: { animation: 'TrendsPage' }
  },
  {
    path: 'photo/:id/:title',
    loadChildren: () => import('./photo-preview/photo-preview.module').then(mod => mod.PhotoPreviewModule),
    data: { animation: 'PhotoPage' }
  },
  {
    path: 'jobs',
    loadChildren: () => import('./jobs/jobs.module').then(mod => mod.JobsModule),
    data: { animation: 'JobsPage' }
  },
  {
    path: 'account',
    component: AccountComponent,
    canLoad: [AuthGuard],
    loadChildren: () => import('./account/account.module').then(mod => mod.AccountModule),
    data: { animation: 'AccountPage' }
  },
  {
    path: 'profile/:userName',
    loadChildren: () => import('./user-profile/user-profile.module').then(mod => mod.UserProfileModule),
    data: { animation: 'ProfilePage' }
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
