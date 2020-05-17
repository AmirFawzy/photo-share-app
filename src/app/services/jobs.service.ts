import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subject, Subscription, BehaviorSubject } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';

import { Job } from '../models/job.model';
import { UiService } from './ui.service';

@Injectable({
  providedIn: 'root'
})
export class JobsService {
  /**
   *Jobs array sorted by latest
   *
   * @type {Subject<Job[]>}
   * @memberof JobsService
   */
  jobs$: Subject<Job[]> = new Subject();

  /**
   *Job details for (job details page)
   *
   * @type {Subject<Job>}
   * @memberof JobsService
   */
  job$: Subject<Job> = new Subject();

  /**
   *Total number of jobs
   *
   * @type {BehaviorSubject<number>}
   * @memberof JobsService
   */
  totalJobsNum$: BehaviorSubject<number> = new BehaviorSubject(0);

  /**
   *Is user search for job or just opened the jobs page
   *
   * @type {BehaviorSubject<boolean>}
   * @memberof JobsService
   */
  isJobSearch$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private userId: string;
  private subscriptions: Subscription[] = [];

  /**
   *Creates an instance of JobsService.
   * @param {AngularFirestore} db firebase database
   * @param {UiService} uiService ui service for loading and friendly message
   * @param {AngularFireAuth} afAuth firebase authentication
   * @param {Router} router angular route service
   * @memberof JobsService
   */
  constructor(
    private db: AngularFirestore,
    private uiService: UiService,
    private afAuth: AngularFireAuth,
    private router: Router
  ) {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid;
      }
    });
  }

  /**
   *Get jobs sorted by latest
   *
   * @emits true to `loadingState`
   *
   * get jobs and mutate each job recived by `map`
   *
   * @emits `jobs` to `jobs$`
   * @emits true to `isJobSearch$`
   * @emits false to `loadingState`
   *
   * @memberof JobsService
   */
  getRecentJobs() {

    // this.uiService.loadingState.next(true);

    this.subscriptions.push(this.db.collection<Job>(`jobs`, ref => ref.orderBy('published')).valueChanges().pipe(
      debounceTime(200),
      map(jobDocs => {

        return jobDocs.map(doc => {

          return {
            ...doc,
            published: new Date((<any>doc.published).seconds * 1000)
          };

        });

      })
    ).subscribe(jobs => {

      this.jobs$.next(jobs);
      this.isJobSearch$.next(false);
      this.uiService.loadingState.next(false);

    }));

  }

  /**
   *Get total number of jobs
   *
   * @emits `jobsNum` to `totalJobsNum$`
   * @memberof JobsService
   */
  getTotalJobsNum() {

    this.subscriptions.push(this.db.doc<{ jobsNum: number }>('jobs/jobsNum').valueChanges().subscribe(
      jobsNum => {

        if (jobsNum) {

          this.totalJobsNum$.next(jobsNum.jobsNum);
        }

      }
    ));

  }

  /**
   *Search for job by keyword
   *
   * @param {string} keyword search keyword
   * @emits true to `loadingState`
   *
   * mutate the data recived by `map`
   *
   * @emits `jobs` to `jobs$`
   * @emits true to `isJobSearch$`
   * @emits false to `loadingState`
   *
   * @memberof JobsService
   */
  searchJobByKeyword(keyword: string) {

    // this.uiService.loadingState.next(true);

    this.subscriptions.push(this.db.collection<Job>('jobs', ref => ref.where('country', '==', `${keyword}`)).snapshotChanges()
      .pipe(
        map(snap => {

          return snap.map(payload => {

            return {
              ...payload.payload.doc.data(),
              published: new Date((<any>payload.payload.doc.data().published).seconds * 1000)
            };

          });

        }),
      ).subscribe(jobs => {

        this.jobs$.next(jobs);
        this.isJobSearch$.next(true);
        this.uiService.loadingState.next(false);

      }));

  }

  /**
   *Post new job
   *
   * @param {Job} job job details to post
   * @emits false to `loadingState` and show friendly message
   * @memberof JobsService
   */
  postJob(job: Job) {

    const docId = this.db.createId();
    // this.uiService.loadingState.next(true);

    this.db.doc<Job>(`jobs/${docId}`).set({
      id: docId,
      ownerId: this.userId,
      title: job.title,
      companyName: job.companyName,
      country: job.country,
      city: job.city,
      vacancy: job.vacancy,
      salary: job.salary,
      period: job.period,
      description: job.description,
      contacts: job.contacts,
      published: job.published,
      roles: {
        [this.userId]: 'owner'
      }

    }).then(() => {

      this.uiService.loadingState.next(false);
      this.uiService.respondMessage('Job posted successfully');

    }).catch(error => {

      this.uiService.loadingState.next(false);
      this.uiService.respondMessage('Something went wrong, please check your internet connection.');

    });

  }

  /**
   *Get job by id for (job page)
   *
   * @param {string} id job id
   * @emits `job` to `jobs$`
   * @emits false to `loadingState`
   * @memberof JobsService
   */
  getJobById(id: string) {

    // this.uiService.loadingState.next(true);

    this.db.doc<Job>(`jobs/${id}`).valueChanges().pipe(
      debounceTime(200),
      map(job => {

        return {
          ...job,
          published: new Date((<any>job.published).seconds * 1000)
        };

      })
    ).subscribe(job => {

      this.job$.next(job);
      this.uiService.loadingState.next(false);

    });

  }

  /**
   *Delete job by id
   *
   * @param {string} id job id
   * @memberof JobsService
   */
  deleteJob(id: string) {

    this.db.doc(`jobs/${id}`).delete()
      .then(() => {

        this.uiService.respondMessage('Job deleted successfully.');
        this.router.navigate(['/jobs']);

      })
      .catch(() => {

        this.uiService.respondMessage('Something went wrong! please check your internet conection.');

      });

  }

  // cancel subscriptions
  cancelSubscriptions() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
