import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScrollPositionService {
  scrollPosition: BehaviorSubject<string> = new BehaviorSubject(null);

  constructor() { }
}
