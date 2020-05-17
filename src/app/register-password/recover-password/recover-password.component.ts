import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';

import { AuthService } from '../../services/auth.service';
import { UiService } from '../../services/ui.service';

@Component({
  selector: 'ps-recover-password',
  templateUrl: './recover-password.component.html',
  styleUrls: ['./recover-password.component.scss']
})
export class RecoverPasswordComponent implements OnInit {
  @ViewChild('f', { static: false }) form: NgForm;
  wWidth = window.innerWidth;

  constructor(
    private authService: AuthService,
    private uiService: UiService
  ) { }

  ngOnInit() {
  }

  /**
   * on submit the recover password form
   * @param form <NgForm> is the form object itself
   * @if true excute [resetPassword] <method> to send request for reset password to firebase
   * @else false excute [respondMessage] <method> to show freindly snack bar message to the user
   */
  onSubmit(form: NgForm) {
    if (form.valid) {
      this.authService.resetPassword(form.value.recoverPassword);
    } else {
      this.uiService.respondMessage('Please enter valid email.');
    }
  }
}
