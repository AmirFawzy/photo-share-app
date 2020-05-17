import { Component, OnInit, ViewChild, ViewEncapsulation, ElementRef, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatDialogRef, MatDialogContent } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { AuthService } from '../../services/auth.service';
import { UiService } from '../../services/ui.service';

interface ElementDimension {
  width: number;
  height: number;
}

@Component({
  selector: 'ps-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LoginComponent implements OnInit, OnDestroy {
  @ViewChild('dialogContent', { static: true }) private readonly dialogContent: MatDialogContent;
  @ViewChild('f', { static: false }) private form: NgForm;
  passwordVisible = false;
  loadingStateSubscription: Subscription;
  progressBarState = false;
  readonly config: PerfectScrollbarConfigInterface = {};
  dialogContentSize: ElementDimension;

  constructor(
    public dialogRef: MatDialogRef<LoginComponent>,
    private authService: AuthService,
    private uiService: UiService
  ) { }

  ngOnInit() {
    // dialog size height & width
    this.dialogContentSize = {
      width: (<ElementRef>this.dialogContent).nativeElement.clientWidth,
      height: (<ElementRef>this.dialogContent).nativeElement.clientHeight
    };

    // subscribe to 'dialogLoadingState' for progressbar
    this.loadingStateSubscription = this.uiService.dialogLoadingState.subscribe(state => {
      this.progressBarState = state;
    });
  }

  /**
   * on submit the login form
   * @param form the form <object>
   * @if true excute [login] <method> to sign-in request to firebase
   * @else false excute [respondMessage] <method> to show snack bar with message
   */
  onSubmit(form: NgForm) {
    if (form.valid) {
      this.authService.login({ email: form.value.email, password: form.value.password }, this.dialogRef);
    } else {
      this.uiService.respondMessage('Invalid email or password.');
    }
  }

  loginWithFacebook() {
    this.authService.facebookLogin(this.dialogRef);
  }

  loginWithGoogle() {
    this.authService.googleLogin(this.dialogRef);
  }

  closeDialog() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.loadingStateSubscription.unsubscribe();
  }
}
