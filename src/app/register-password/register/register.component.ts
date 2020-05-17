import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { countriesList, CountriesList } from '../../models/countries-list.model';
import { AuthService } from '../../services/auth.service';
import { UiService } from '../../services/ui.service';
import { matchingInputsValidator } from 'src/app/shared/matchingInputsValidator';

@Component({
  selector: 'ps-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class RegisterComponent implements OnInit {
  form: FormGroup;
  wWidth = window.innerWidth;
  passwordVisible = false;
  maxDate = new Date();
  countries: CountriesList[] = countriesList;

  constructor(
    private authService: AuthService,
    private uiService: UiService
  ) { }

  ngOnInit() {
    this.form = new FormGroup({
      userName: new FormGroup({
        firstName: new FormControl('', Validators.required),
        lastName: new FormControl('', Validators.required)
      }),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormGroup({
        password: new FormControl('', [Validators.required, Validators.minLength(8)]),
        confirm: new FormControl({ value: '', disabled: true }, Validators.required)
      }, { validators: matchingInputsValidator('password', 'confirm', 'notMatched') }),
      birthdate: new FormControl(''),
      country: new FormControl(''),
      conditions: new FormControl(false, Validators.required)
    });

    /**
     * check everytime password input value changes
     * if input valid set repeatPassword input to be enabled
     * if input invalid set repeatPassword input to disabled
     */
    this.form.get('password.password').valueChanges.subscribe(val => {

      if (val) {

        const confirmPasssword = this.form.get('password.confirm');
        const passwordInp = this.form.get('password.password');

        passwordInp.invalid ? confirmPasssword.disable() : confirmPasssword.enable();

      }

    });
  }

  getFormControlError(controlName: string, errorCode: string): boolean | null {
    return this.form.get(controlName).hasError(errorCode);
  }

  getFormControlValue<T>(controlName: string): T {
    return this.form.get(controlName).value;
  }

  get passwordsDoNotMatch(): boolean {
    return this.form.controls['password'].errors && this.getFormControlError('password', 'notMatched')
      && this.form.get('password.confirm').dirty;
  }

  get passwordMatched(): boolean {
    return this.getFormControlValue<string>('password.password')
      === this.getFormControlValue<string>('password.confirm');
  }

  /**
   * on submit the register form
   * @param form <NgForm> the form object
   * @if true create new account
   * @else false or error show snackbar with message
   */
  async onSubmit() {

    if (this.form.valid) {

      await this.authService.register(
        {
          email: this.getFormControlValue<string>('email'),
          password: this.getFormControlValue<string>('password.password')
        },
        {
          userPhoto: '',
          userPhotoStoragePath: '',
          firstName: this.getFormControlValue<string>('userName.firstName'),
          lastName: this.getFormControlValue<string>('userName.lastName'),
          email: this.getFormControlValue<string>('email'),
          birthdate: this.getFormControlValue<Date>('birthdate'),
          country: this.getFormControlValue<string>('country'),
          aboutMe: '',
          hiringAvailability: true,
          socialLinks: {
            website: '',
            facebook: '',
            twitter: '',
            instagram: '',
            tumblr: ''
          },
          uid: '',
          userName: '',
          notificationsByEmail: true,
          newsletterSubscription: true
        });

    } else {

      this.uiService.respondMessage('Please complete all inputs with valid data');

    }
  }
}
