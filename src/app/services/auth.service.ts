import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { auth } from 'firebase/app';
import { BehaviorSubject } from 'rxjs';

import { Auth } from '../models/auth.model';
import { UiService } from './ui.service';
import { User } from '../models/user.model';
import { LoginComponent } from '../shared/login/login.component';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  authChange = new BehaviorSubject<boolean>(false);
  private isAuthenticated = false;

  constructor(
    private afAuth: AngularFireAuth,
    private uiService: UiService,
    private router: Router,
    private db: AngularFirestore,
    private storage: AngularFireStorage
  ) {
  }

  /**
   * intial auth state excute ASAP app opened
   * @if true reassign @this isAuthenticated and emit @this authChange to true
   * @else false reassign @this isAuthenticated and emit @this authChange to false
   */
  intialAuthListener() {

    this.afAuth.authState.subscribe((user) => {

      if (user) {

        this.isAuthenticated = true;
        this.authChange.next(true);

      } else {

        this.isAuthenticated = false;
        this.authChange.next(false);
        this.router.navigate(['/']);

      }

    });

  }

  /**
   * register method for create new account
   * @param authData <Auth> holds credential data
   * emit new value to [dialogLoadingState] ... start
   * send request to firebase to create new account with email and password
   * emit new value to [dialogLoadingState] ... stop
   * excute @this setUserSettings <method> to create user document in database
   * send verification email to the user via email and show firendly message when succeded or failed
   * navigate back to 'home page'
   * if there's error [dialogLoadingState] ... stop
   * show snackbar with error message recived from firebase
   */
  register(authData: Auth, accountSettings: User) {

    this.uiService.loadingState.next(true);   // start loading

    this.afAuth.auth.createUserWithEmailAndPassword(authData.email, authData.password)
      .then(async userCredential => {

        this.uiService.loadingState.next(false);  // stop loading

        await this.setUserSettings(accountSettings, userCredential.user.uid, false);

        await this.afAuth.auth.currentUser.sendEmailVerification()
          .then(result => {
            this.uiService.respondMessage('Cehck your inbox to verify you account');
          })
          .catch(error => {
            this.uiService.respondMessage('Somthing went wrong!');
          });

        this.router.navigate(['/']);

      })
      .catch(error => {

        this.uiService.loadingState.next(false);  // stop loading
        this.uiService.respondMessage(error.message);

      });
  }

  /**
   * login <method> for login the users to thier accounts
   * @param authData <Auth> hold credential data
   * @param dilogRef <MatDialogRef> it's the loging dialog referrence
   * emit new value to [dialogLoadingState] ... start
   * send request to firebase to login the user
   * emit new value to [dialogLoadingState] ... stop
   * close the login dialog then navigate to 'home page'
   * if there's error [dialogLoadingState] ... stop
   * show snackbar with error message recived from firebase
   */
  login(authData: Auth, dilogRef: MatDialogRef<LoginComponent>) {

    this.uiService.dialogLoadingState.next(true);   // start loading

    this.afAuth.auth.signInWithEmailAndPassword(authData.email, authData.password)
      .then(userCredential => {

        this.uiService.dialogLoadingState.next(false);  // stop loading
        dilogRef.close();
        this.router.navigate(['/']);

      })
      .catch(error => {

        this.uiService.dialogLoadingState.next(false);  // stop loading
        this.uiService.respondMessage(error.message);

        if (error.code === 'auth/user-not-found') {
          this.uiService.respondMessage('Invalid email or password.');
        }

      });

  }

  /**
   * login with facebook to sign users in using their facebook account
   * emit new value to [dialogLoadingState] ... start
   * @const provider <Instance> instance of facebook authentication provider
   * excute [signInWithPopup] to open popup window for sign user in by facebook account
   * @param result is the respond data after login
   * emit new value to [dialogLoadingState] ... stop
   * excute @this setUserSettings <method> to create user document in database
   * navigate back to 'home page'
   * if there's an error emit new value to [dialogLoadingState] ... stop
   * @const errorCode the error type @const email email address send with error
   * @if true excute [respondMessage] to show to user freindly message about the error
   * @else any other error type excute [respondMessage] with the [error.message]
   */
  async facebookLogin(dilogRef: MatDialogRef<LoginComponent>) {

    this.uiService.dialogLoadingState.next(true);   // start loading

    const provider = new auth.FacebookAuthProvider();
    await provider.addScope('user_location');   // add request for special data to include in login promise

    this.afAuth.auth.signInWithPopup(provider)
      .then(async result => {

        this.uiService.dialogLoadingState.next(false);   // stop loading

        if (result.additionalUserInfo.isNewUser) {

          await this.setUserSettings({
            userPhoto: (<any>result.additionalUserInfo.profile).picture.data.url,
            userPhotoStoragePath: '',
            firstName: (<any>result.additionalUserInfo.profile).first_name,
            lastName: (<any>result.additionalUserInfo.profile).last_name,
            email: (<any>result.additionalUserInfo.profile).email,
            birthdate: (<any>result.additionalUserInfo.profile).birthday,
            country: (<any>result.additionalUserInfo.profile).location.name,
            aboutMe: '',
            hiringAvailability: true,
            socialLinks: {
              website: '',
              twitter: '',
              facebook: '',
              instagram: '',
              tumblr: ''
            },
            userName: '',
            notificationsByEmail: true,
            newsletterSubscription: true,
            uid: ''
          }, result.user.uid);

          dilogRef.close();

          this.router.navigate(['/']);

        } else {

          dilogRef.close();
          this.router.navigate(['/']);

        }

      })
      .catch(error => {

        this.uiService.dialogLoadingState.next(false);   // stop loading

        const errorCode: string = error.code;

        if (errorCode === 'auth/account-exists-with-different-credential') {

          this.uiService.respondMessage(`An account already exists with the same email address.`);

        } else {

          this.uiService.respondMessage(error.message);

        }

      });

  }

  /**
   * on sign in with google account
   * emit new value to [dialogLoadingState] <boolean> ... start
   * @const provider <instance> instance of google authentication provilder
   * excute [signInWithPopup] to show popup for login to the google account
   * emit new value to [dialogLoadingState] ... stop and navigate back to 'home page'
   * if there's an error emit new value to [dialogLoadingState] ... stop
   * excute [respondMessage] to show to the user friendly message about the error
   */
  googleLogin(dilogRef: MatDialogRef<LoginComponent>) {

    this.uiService.dialogLoadingState.next(true);   // start loading

    const provider = new auth.GoogleAuthProvider();

    this.afAuth.auth.signInWithPopup(provider)
      .then(async result => {

        this.uiService.dialogLoadingState.next(false);   // stop loading

        if (result.additionalUserInfo.isNewUser) {

          await this.setUserSettings({
            userPhoto: (<any>result.additionalUserInfo.profile).picture,
            userPhotoStoragePath: '',
            firstName: (<any>result.additionalUserInfo.profile).given_name,
            lastName: (<any>result.additionalUserInfo.profile).family_name,
            email: (<any>result.additionalUserInfo.profile).email,
            birthdate: null,
            country: '',
            aboutMe: '',
            hiringAvailability: true,
            socialLinks: {
              website: '',
              twitter: '',
              facebook: '',
              instagram: '',
              tumblr: ''
            },
            userName: '',
            notificationsByEmail: true,
            newsletterSubscription: true,
            uid: ''
          }, result.user.uid);

          dilogRef.close();

          this.router.navigate(['/']);

        } else {

          dilogRef.close();
          this.router.navigate(['/']);

        }

      })
      .catch(error => {

        this.uiService.dialogLoadingState.next(false);   // stop loading
        this.uiService.respondMessage(error.message);

      });
  }

  /**
   * signout <method> to sign out the user from thier accounts
   * if failed to sign out show error message
   */
  async signout(): Promise<boolean> {
    await this.afAuth.auth.signOut();
    return this.router.navigate(['/']);
  }

  /**
   * on resetPassword <method> for reset the password of the user account
   * @param email <string> user email (the same email user signed up with)
   * emit new value to [loadingState] ... start
   * send request to firebase for reseting password by email
   * emit new value to [loadingState] ... stop
   * excute [respondMessage] to show friendly message to the user
   * navigate back to 'home page'
   * if there's an error emit nre value to [loadingState] ... stop
   * excute [respondMessage] with error message to the user
   */
  resetPassword(email: string) {

    this.uiService.loadingState.next(true);   // start loading

    this.afAuth.auth.sendPasswordResetEmail(email)
      .then(() => {

        this.uiService.loadingState.next(false);    // stop loading
        this.uiService.respondMessage('Check your inbox to reset your password.');
        this.router.navigate(['/']);

      })
      .catch(error => {

        this.uiService.loadingState.next(false);    // stop loading
        this.uiService.respondMessage(error.message);

      });

  }

  // return if the user authenticated or not
  isAuth(): boolean {
    return this.isAuthenticated;
  }

  /**
   * add user account data to database
   * @param accountSettings <User> holds the user settings
   * @param uid <string> user id in database
   * @param provider <boolean> true if signup with provider - false if signup with email and password
   * @if true @const id <string> random id generated by firebase
   * copy all the properites from object to target object [without] 'userPhoto' property then
   * create doc with new data fields in database
   * @else false get the [getDownloadURL()] of the 'default-user.png' from storage and turn it to promise
   * create doc with new data fields in database [with] 'userPhoto' property
   */
  private setUserSettings(accountSettings: User, uid: string, provider = true) {

    if (provider) {

      this.db.doc<User>(`users/${uid}/accountSettings/settings`).set(Object.assign({}, accountSettings, {
        uid: uid,
        userName: `${accountSettings.firstName} ${accountSettings.lastName}`
      }));

    } else {

      this.storage.ref('default-user.png')
        .getDownloadURL()
        .toPromise()
        .then(url => {
          this.db.doc(`users/${uid}/accountSettings/settings`).set(Object.assign({}, accountSettings, {
            uid: uid,
            userPhoto: url,
            userName: `${accountSettings.firstName} ${accountSettings.lastName}`
          }));
        });

    }

  }
}
