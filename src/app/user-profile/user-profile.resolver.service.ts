import { Injectable } from '@angular/core';
import { Resolve, RouterStateSnapshot, ActivatedRouteSnapshot, Router } from '@angular/router';
import { take, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { GeneralData } from '../models/user.model';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root'
})
export class UserProfileResolverService implements Resolve<GeneralData> {

  constructor(private userService: UserService, private router: Router) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):
    Observable<GeneralData> | Promise<GeneralData> | GeneralData {
    const userProfileId = route.queryParams['upi'];

    return this.userService.getUserGeneralData(userProfileId).pipe(
      take(1),
      map(generalData => {
        if (generalData) {
          return generalData;
        } else {
          this.router.navigate(['/']);
          return null;
        }
      })
    );

  }

}
