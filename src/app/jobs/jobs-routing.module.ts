import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SearchJobComponent } from './search/search-job.component';
import { JobDetailsComponent } from './job-details/job-details.component';

const routes: Routes = [
  { path: '', component: SearchJobComponent },
  { path: 'details/:id', component: JobDetailsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class JobsRoutingModule { }
