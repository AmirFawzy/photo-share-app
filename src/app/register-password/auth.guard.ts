import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  CanLoad,
  Route,
  UrlSegment,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router
} from '@angular/router';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { AuthService } from '../services/auth.service';
import { LoginComponent } from '../shared/login/login.component';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad {

  constructor(
    private authService: AuthService,
    public dialog: MatDialog,
    private router: Router
  ) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this.authService.isAuth()) {
      return true;
    } else {
      this.router.navigate(['/']);
      this.authService.intialAuthListener();
      const wWidth = window.innerWidth;
      const dialogRef = this.dialog.open(LoginComponent, {
        backdropClass: 'backdrop',
        closeOnNavigation: true,
        autoFocus: false
      });

      if (wWidth <= 480) {
        dialogRef.updateSize('80vw');
      } else if (wWidth <= 768) {
        dialogRef.updateSize('70vw');
      } else if (wWidth <= 992) {
        dialogRef.updateSize('60vw');
      } else if (wWidth <= 1200) {
        dialogRef.updateSize('50vw');
      } else if (wWidth > 1200) {
        dialogRef.updateSize('600px');
      }
    }
  }

  canActivateChild(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this.authService.isAuth()) {
      return true;
    } else {
      this.router.navigate(['/']);
      const wWidth = window.innerWidth;
      const dialogRef = this.dialog.open(LoginComponent, {
        backdropClass: 'backdrop',
        closeOnNavigation: true,
        autoFocus: false
      });

      if (wWidth <= 480) {
        dialogRef.updateSize('80vw');
      } else if (wWidth <= 768) {
        dialogRef.updateSize('70vw');
      } else if (wWidth <= 992) {
        dialogRef.updateSize('60vw');
      } else if (wWidth <= 1200) {
        dialogRef.updateSize('50vw');
      } else if (wWidth > 1200) {
        dialogRef.updateSize('600px');
      }
    }
  }

  canLoad(
    route: Route,
    segments: UrlSegment[]): Observable<boolean> | Promise<boolean> | boolean {
    if (this.authService.isAuth()) {
      return true;
    } else {
      this.router.navigate(['/']);
      const wWidth = window.innerWidth;
      const dialogRef = this.dialog.open(LoginComponent, {
        backdropClass: 'backdrop',
        closeOnNavigation: true,
        autoFocus: false
      });

      if (wWidth <= 480) {
        dialogRef.updateSize('80vw');
      } else if (wWidth <= 768) {
        dialogRef.updateSize('70vw');
      } else if (wWidth <= 992) {
        dialogRef.updateSize('60vw');
      } else if (wWidth <= 1200) {
        dialogRef.updateSize('50vw');
      } else if (wWidth > 1200) {
        dialogRef.updateSize('600px');
      }
    }
  }
}
