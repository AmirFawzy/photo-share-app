import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { Job } from 'src/app/models/job.model';
import { JobsService } from '../../services/jobs.service';
import * as dayjs from 'dayjs';
import * as relativeTime from 'dayjs/plugin/relativeTime';
import { trigger, transition, query, style, stagger, animate } from '@angular/animations';

dayjs.extend(relativeTime);

@Component({
  selector: 'ps-job-details',
  templateUrl: './job-details.component.html',
  styleUrls: ['./job-details.component.scss'],
  animations: [
    trigger('contentAnimation', [
      transition('* <=> *', [
        query('.animate-in', [
          style({ opacity: 0, transform: 'translateY(-20px)' }),
          stagger(150, [animate('1s ease-in-out', style({ opacity: 1, transform: 'translateY(0px)' }))])
        ], { optional: true })
      ])
    ])
  ]
})
export class JobDetailsComponent implements OnInit, OnDestroy {
  job: Job;
  today = new Date();
  time = dayjs;
  isOwner: boolean;
  private subscribtions: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private jobService: JobsService,
    private afAuth: AngularFireAuth
  ) { }

  ngOnInit() {
    const jobId = this.route.snapshot.params['id'];

    this.jobService.getJobById(jobId);

    this.subscribtions.add(this.jobService.job$.subscribe(job => {

      if (job) {
        this.job = job;
      }

    }));

    this.subscribtions.add(this.jobService.job$.pipe(
      switchMap(() => this.afAuth.authState)
    ).subscribe(authState => {

      const currentUid = authState.uid;

      if (currentUid === this.job.ownerId) {
        this.isOwner = true;
      } else {
        this.isOwner = false;
      }

    }));
  }

  /**
   * get job id from route/url
   * loop on users array if 'userUID' match user.id
   * loop jobs array in user object and if this job in the user object delete this job
   * then loop on job array if this job match job in array delete this job
   * navigate to jobs search page
  */
  onDelete() {
    const jobId = this.route.snapshot.params['id'];

    this.jobService.deleteJob(jobId);
  }

  ngOnDestroy() {
    this.jobService.cancelSubscriptions();
    this.subscribtions.unsubscribe();
  }
}
