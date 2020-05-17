import { Component, OnInit, ViewEncapsulation, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { trigger, transition, state, style, animate } from '@angular/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';

import { CountriesList, countriesList } from '../../models/countries-list.model';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { UiService } from '../../services/ui.service';
import { matchingInputsValidator } from 'src/app/shared/matchingInputsValidator';

@Component({
  selector: 'ps-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('fadeInOut', [
      state('true', style({ opacity: '*' })),
      state('false', style({ opacity: 0 })),
      transition('true <=> false', animate('800ms ease-in-out'))
    ])
  ]
})
export class SettingsComponent implements OnInit, OnDestroy {
  settingsForm: FormGroup;
  accountSettings: User;
  passwordVisible = false;
  maxDate = new Date();
  countries: CountriesList[] = countriesList;
  wWidth = window.innerWidth;
  loadingState = false;
  accountSettingsSubscription: Subscription;
  loadingStateSubscription: Subscription;
  oldEmail: string;

  constructor(
    public snackBar: MatSnackBar,
    private userService: UserService,
    private uiService: UiService,
    private afAuth: AngularFireAuth,
    private changeRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.settingsForm = new FormGroup({
      userName: new FormGroup({
        firstName: new FormControl('', Validators.required),
        lastName: new FormControl('', Validators.required),
      }),
      email: new FormControl('', [Validators.email]),
      password: new FormGroup({
        password: new FormControl('', [Validators.minLength(8)]),
        confirm: new FormControl({ value: '', disabled: true }),
      }, { validators: matchingInputsValidator('password', 'confirm', 'notMatched') }),
      birthdate: new FormControl(''),
      aboutMe: new FormControl(''),
      country: new FormControl(''),
      hiringAvailability: new FormControl(true),
      socialLinks: new FormGroup({
        website: new FormControl('', Validators.pattern(/^((https?|ftp|smtp):\/\/)?(www.)?[a-z0-9]+\.[a-z]+(\/[a-zA-Z0-9#]+\/?)*$/)),
        facebook: new FormControl('', Validators.pattern(/^((https?|ftp|smtp):\/\/)?(www.)?[a-z0-9]+\.[a-z]+(\/[a-zA-Z0-9#]+\/?)*$/)),
        twitter: new FormControl('', Validators.pattern(/^((https?|ftp|smtp):\/\/)?(www.)?[a-z0-9]+\.[a-z]+(\/[a-zA-Z0-9#]+\/?)*$/)),
        insta: new FormControl('', Validators.pattern(/^((https?|ftp|smtp):\/\/)?(www.)?[a-z0-9]+\.[a-z]+(\/[a-zA-Z0-9#]+\/?)*$/)),
        tumblr: new FormControl('', Validators.pattern(/^((https?|ftp|smtp):\/\/)?(www.)?[a-z0-9]+\.[a-z]+(\/[a-zA-Z0-9#]+\/?)*$/)),
      })
    });

    // fire the method responsible for fetch user account serttings from [userService]
    this.userService.getUserAccountSettings(false);

    /**
     * account settings subscription from [userService.accountSettings]
     * @param settings <User> the returning value from subscribe 'settings'
     * set @this accountSettings to @this afAuth currentUser email
     * set @this oldEmail to [settings.email]
     * @if true patch value of the form with [bithdate] property
     * @const birthdate <Date> the birthdate for the user
     * @else patch value of the form without [birthdate] property to avoid errors
     */
    this.accountSettingsSubscription = this.userService.accountSettings$.subscribe(
      (settings: User) => {

        this.accountSettings = settings;
        this.oldEmail = this.afAuth.auth.currentUser.email;

        if (settings.birthdate !== null) {

          const birthdate = settings.birthdate;

          // set form value with the user settings
          this.settingsForm.patchValue({
            userName: {
              firstName: settings.firstName,
              lastName: settings.lastName,
            },
            email: this.afAuth.auth.currentUser.email,
            birthdate: new Date(birthdate.getFullYear(), birthdate.getMonth(), birthdate.getDate()),
            country: settings.country,
            aboutMe: settings.aboutMe,
            hiringAvailability: settings.hiringAvailability,
            socialLinks: {
              website: settings.socialLinks.website,
              facebook: settings.socialLinks.facebook,
              twitter: settings.socialLinks.twitter,
              insta: settings.socialLinks.instagram,
              tumblr: settings.socialLinks.tumblr,
            }
          });

        } else {

          // set form value with the user settings
          this.settingsForm.patchValue({
            userName: {
              firstName: settings.firstName,
              lastName: settings.lastName,
            },
            email: settings.email,
            country: settings.country,
            aboutMe: settings.aboutMe,
            hiringAvailability: settings.hiringAvailability,
            socialLinks: {
              website: settings.socialLinks.website,
              facebook: settings.socialLinks.facebook,
              twitter: settings.socialLinks.twitter,
              insta: settings.socialLinks.instagram,
              tumblr: settings.socialLinks.tumblr,
            }
          });

        }

      }
    );

    // loading state subscription from [uiService]
    this.loadingStateSubscription = this.uiService.loadingState.subscribe(
      (loadingState: boolean) => {

        this.loadingState = loadingState;
        this.changeRef.detectChanges();

      }
    );


    /**
     * check everytime password input value changes
     * if input valid set repeatPassword input to be enabled
     * if input invalid set repeatPassword input to disabled
     */
    this.settingsForm.get('password.password').valueChanges.subscribe(val => {

      if (val) {

        const confirmPassword = this.settingsForm.get('password.confirm');
        const passwordInp = this.settingsForm.get('password.password');

        passwordInp.invalid ? confirmPassword.disable() : confirmPassword.enable();

      }

    });
  }

  getFormControlError(controlName: string, errorCode: string): boolean | null {
    return this.settingsForm.get(controlName).hasError(errorCode);
  }

  getFormControValue<T>(controlName: string): T {
    return this.settingsForm.get(controlName).value;
  }

  get passwordDoNotMatch(): boolean {
    return this.settingsForm.controls['password'].errors && this.getFormControlError('password', 'notMatched')
      && this.settingsForm.get('password.confirm').dirty;
  }

  get passwordMatched(): boolean {
    return this.getFormControValue<string>('password.password')
      === this.getFormControValue<string>('password.confirm');
  }

  /**
   * on submit the form check
   * if there's a value set for password cehck
   * then if the both field of password valid, if true submit to the user.accountSettings, if not show snackbar
   * if there's no value set for password fields check if the rest of the form valid or not
   * then if true(valid) submit the form if false(invalid) show snackbar error
   */
  onSubmit() {

    const passwordInpVal = this.getFormControValue<string>('password.password');

    if (passwordInpVal) {

      if (this.passwordMatched) {

        this.userService.updateUserAccountSettings({
          firstName: this.settingsForm.get('userName.firstName').value,
          lastName: this.settingsForm.get('userName.lastName').value,
          birthdate: this.settingsForm.get('birthdate').value,
          aboutMe: this.settingsForm.get('aboutMe').value,
          country: this.settingsForm.get('country').value,
          hiringAvailability: this.settingsForm.get('hiringAvailability').value,
          socialLinks: {
            website: this.settingsForm.get('socialLinks.website').value,
            facebook: this.settingsForm.get('socialLinks.facebook').value,
            twitter: this.settingsForm.get('socialLinks.twitter').value,
            instagram: this.settingsForm.get('socialLinks.insta').value,
            tumblr: this.settingsForm.get('socialLinks.tumblr').value,
          }
        });

      } else {

        this.uiService.respondMessage('Password not matched.');

      }

    } else {

      if (this.settingsForm.valid) {

        this.userService.updateUserAccountSettings({
          firstName: this.settingsForm.get('userName.firstName').value,
          lastName: this.settingsForm.get('userName.lastName').value,
          birthdate: this.settingsForm.get('birthdate').value,
          aboutMe: this.settingsForm.get('aboutMe').value,
          country: this.settingsForm.get('country').value,
          hiringAvailability: this.settingsForm.get('hiringAvailability').value,
          socialLinks: {
            website: this.settingsForm.get('socialLinks.website').value,
            facebook: this.settingsForm.get('socialLinks.facebook').value,
            twitter: this.settingsForm.get('socialLinks.twitter').value,
            instagram: this.settingsForm.get('socialLinks.insta').value,
            tumblr: this.settingsForm.get('socialLinks.tumblr').value,
          }
        });

      } else {

        this.uiService.respondMessage('Please make sure all fields are valid.');

      }

    }

  }

  onUpdateEmail(email: string) {
    this.userService.updateEmail(email);
  }

  onUpdatePassword(password: string) {
    this.userService.updatePassword(password);
  }

  ngOnDestroy() {
    this.accountSettingsSubscription.unsubscribe();
    this.loadingStateSubscription.unsubscribe();
    this.userService.cancelSubscription();
  }

}
