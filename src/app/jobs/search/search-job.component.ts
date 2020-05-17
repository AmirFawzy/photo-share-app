import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { trigger, transition, useAnimation } from '@angular/animations';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import { PostJobDialogComponent } from './post-job-dialog/post-job-dialog.component';
import { LoginComponent } from 'src/app/shared/login/login.component';
import { Job } from 'src/app/models/job.model';
import { AuthService } from 'src/app/services/auth.service';
import { JobsService } from '../../services/jobs.service';
import * as dayjs from 'dayjs';
import * as relativeTime from 'dayjs/plugin/relativeTime';
import { fadingStaggerAnimation } from 'src/app/animations/fading-animation';

dayjs.extend(relativeTime);

@Component({
  selector: 'ps-job-search',
  templateUrl: './search-job.component.html',
  styleUrls: ['./search-job.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('listAnimation', [
      transition('* <=> *', [
        useAnimation(fadingStaggerAnimation(':enter', '.5s', 'ease', 100))
      ])
    ])
  ]
})
export class SearchJobComponent implements OnInit, OnDestroy {
  searchForm: FormGroup;
  today = new Date();
  isAuth: boolean;
  jobs: Job[];
  totalJobsNum: number;
  isJobSearch: boolean;
  time = dayjs;
  belowTabletScreen = false;  //  is breakpoint 767.99px and down
  private subscriptions: Subscription = new Subscription();

  constructor(
    private dialog: MatDialog,
    private authService: AuthService,
    private jobsService: JobsService,
    private breakpointService: BreakpointObserver
  ) {
    this.searchForm = new FormGroup({
      search: new FormControl()
    });
  }

  ngOnInit() {
    this.authService.authChange.subscribe((authState: boolean) => this.isAuth = authState);

    this.jobsService.getRecentJobs();
    this.jobsService.getTotalJobsNum();

    this.subscriptions.add(this.jobsService.jobs$.subscribe(jobs => {
      this.jobs = jobs;
      // sort jobs by date
      this.jobs.sort(this.sortByDate);
    }));

    this.subscriptions.add(this.jobsService.totalJobsNum$.subscribe(
      totalJobs => this.totalJobsNum = totalJobs
    ));

    this.subscriptions.add(this.jobsService.isJobSearch$.subscribe(
      isSearch => {
        this.isJobSearch = isSearch;
      }
    ));

    this.subscriptions.add(this.breakpointService
      .observe(['(max-width: 767.99px)'])
      .subscribe(state => {

        if (state.breakpoints['(max-width: 767.99px)']) {
          this.belowTabletScreen = true;
        } else {
          this.belowTabletScreen = false;
        }

      }));
  }

  //  sort by date
  private sortByDate(a: Job, b: Job): number {
    if (a.published < b.published) {
      return 1;
    }
    if (a.published > b.published) {
      return -1;
    }
    return 0;
  }

  onSubmit() {

    const searchKeyword = this.searchForm.get('search').value as string;

    if (searchKeyword.trim().length) {
      this.jobsService.searchJobByKeyword(searchKeyword);
    }

  }

  private breakpointIsMatched(breakpoint: string, prefix = 'max'): boolean {
    return this.breakpointService.isMatched(`(${prefix}-width: ${breakpoint})`);
  }

  onPostJob() {

    // if the user authenticated
    if (this.isAuth) {

      const dialogRef = this.dialog.open(PostJobDialogComponent, {
        backdropClass: 'backdrop',
        closeOnNavigation: true,
        autoFocus: false
      });

      if (this.breakpointIsMatched('480px')) {
        dialogRef.updateSize('76vw');
      } else if (this.breakpointIsMatched('768px')) {
        dialogRef.updateSize('70vw');
      } else if (this.breakpointIsMatched('992px')) {
        dialogRef.updateSize('56vw');
      } else if (this.breakpointIsMatched('1200px')) {
        dialogRef.updateSize('46vw');
      } else if (this.breakpointIsMatched('1201px', 'min')) {
        dialogRef.updateSize('560px');
      }

      dialogRef.afterClosed().subscribe(job => {
        if (job) {
          this.jobsService.postJob({
            title: job.jobTitle,
            companyName: job.companyName,
            country: job.country,
            city: job.city,
            vacancy: job.vacancy,
            salary: job.salary,
            description: job.description,
            period: job.period,
            contacts: job.contact,
            published: new Date(),
            id: '',
            ownerId: ''
          });
        }
      });

    }

    // if the user not authenticated
    if (!this.isAuth) {

      const dialogRef = this.dialog.open(LoginComponent, {
        backdropClass: 'backdrop',
        closeOnNavigation: true,
        autoFocus: false
      });

      if (this.breakpointIsMatched('480px')) {
        dialogRef.updateSize('80vw');
      } else if (this.breakpointIsMatched('768px')) {
        dialogRef.updateSize('70vw');
      } else if (this.breakpointIsMatched('992px')) {
        dialogRef.updateSize('60vw');
      } else if (this.breakpointIsMatched('1200px')) {
        dialogRef.updateSize('50vw');
      } else if (this.breakpointIsMatched('1201px', 'min')) {
        dialogRef.updateSize('600px');
      }

    }

  }

  getAllJobs() {
    this.jobsService.getRecentJobs();
    this.jobsService.getTotalJobsNum();
    this.searchForm.reset();
  }

  ngOnDestroy() {
    this.jobsService.cancelSubscriptions();
    this.subscriptions.unsubscribe();
  }

}
