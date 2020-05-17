import { Component, OnInit, ViewEncapsulation, ViewChild, HostListener, Input, Output, EventEmitter, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { BreakpointObserver } from '@angular/cdk/layout';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';

import { LoginComponent } from '../../shared/login/login.component';
import { AuthService } from '../../services/auth.service';
import { SearchService } from '../../services/search.service';

@Component({
  selector: 'ps-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('openCloseSearch', [
      state('false', style({ opacity: 0, visibility: 'hidden' })),
      state('true', style({ opacity: '*', visibility: '*' })),
      transition('false <=> true', animate('.3s'))
    ]),
    trigger('focusBlurSearch', [
      state('false', style({ opacity: .8 })),
      state('true', style({ opacity: '*' })),
      transition('false <=> true', animate(300))
    ])
  ]
})
export class HeaderComponent implements OnInit {
  @ViewChild('moreMenu', { static: true }) moreMenu: MatMenu;
  @ViewChild('menuTrigger', { static: false }) menuTrigger: MatMenuTrigger;
  @ViewChild('fl', { static: false }) searchFormL: NgForm;
  @ViewChild('fr', { static: false }) searchFormR: NgForm;
  @ViewChild('ff', { static: false }) searchFormF: NgForm;
  @ViewChild('lineTop', { static: false }) hamburgerMneuLineTop: ElementRef;
  @Input() homePageUrl = false;
  @Input() isPassedHeroSlider = false;
  @Output() sidenavTrigger: EventEmitter<boolean> = new EventEmitter<boolean>();
  isFocus = false;
  navOpened = false;
  isSearchInputOpened = false;
  window = window;
  isAuth: boolean;
  tabletScreenDown = false;  // breakpoint 768px and down
  aboveTabletScreen = false;   // breakpoint 769px and up

  constructor(
    public dialog: MatDialog,
    private router: Router,
    private authService: AuthService,
    private searchService: SearchService,
    private breakpointObserver: BreakpointObserver
  ) { }

  ngOnInit() {
    this.moreMenu.panelClass = 'more-menu';

    this.authService.authChange.subscribe(authState => this.isAuth = authState);

    this.breakpointObserver
      .observe(['(max-width: 768px)', '(min-width: 769px)'])
      .subscribe(stat => {

        if (stat.breakpoints['(max-width: 768px)']) {

          this.tabletScreenDown = true;
          this.aboveTabletScreen = false;

        } else if (stat.breakpoints['(min-width: 769px)']) {

          this.aboveTabletScreen = true;
          this.tabletScreenDown = false;

        } else {

          this.tabletScreenDown = false;
          this.aboveTabletScreen = false;

        }

      });

  }

  @HostListener('window:scroll', []) closeMenu() {
    this.menuTrigger.closeMenu();
  }

  onSubmit(form: NgForm) {
    return false;
  }

  private breakpointIsMatched(breakpoint: string): boolean {
    return this.breakpointObserver.isMatched(`(max-width: ${breakpoint})`);
  }

  openLoginDialog() {

    const dialogRef = this.dialog.open(LoginComponent, {
      backdropClass: 'backdrop',
      closeOnNavigation: true,
      autoFocus: false
    });

    if (this.breakpointIsMatched('480px')) {
      dialogRef.updateSize('80vw');
    } else if (this.breakpointIsMatched('768px')) {
      dialogRef.updateSize('70vw');
    } else if (this.breakpointIsMatched('992px')) {
      dialogRef.updateSize('60vw');
    } else if (this.breakpointIsMatched('1200px')) {
      dialogRef.updateSize('50vw');
    } else if (this.breakpointObserver.isMatched('(min-width: 1200.1px)')) {
      dialogRef.updateSize('600px');
    }

  }

  onSearch(keyword: string) {
    this.searchService.getPhotosByKeyword(keyword.toLowerCase());

    const makeParam = keyword.toLowerCase().split(' ').join('-');

    this.router.navigate(['/search', makeParam]);

    if (this.searchFormL) {
      this.searchFormL.reset();
    }

    if (this.searchFormR) {
      this.searchFormR.reset();
    }

    this.searchFormF.reset();
  }

  /**
   * @this navOpened <boolean> reverse it's value
   * @this sidenavTrigger <EventEmitter> emit @this navOpened value
   * @const pathOldValue old value of the topline of the hamburger menu @const pathNewValue new value
   * @if true set new attribute {d} and value @const pathNewValue
   * @else set replace attribute {d} with balue @const pathOldValue
   */
  onOpenSidenav() {

    this.navOpened = !this.navOpened;
    this.sidenavTrigger.emit(this.navOpened);

    const open = `m 50,33 h 40 c 0,0 9.044436,-0.654587 9.044436,-8.508902 0,-7.854315 -8.024349,
      -11.958003 -14.89975,-10.85914 -6.875401,1.098863 -13.637059,4.171617 -13.637059,16.368042 v 40`;
    const close = `m 30,33 h 40 c 0,0 9.044436,-0.654587 9.044436,-8.508902 0,-7.854315 -8.024349,
      -11.958003 -14.89975,-10.85914 -6.875401,1.098863 -13.637059,4.171617 -13.637059,16.368042 v 40`;

    if (this.navOpened) {
      this.hamburgerMneuLineTop.nativeElement.setAttribute('d', close);
    } else {
      this.hamburgerMneuLineTop.nativeElement.setAttribute('d', open);
    }

  }

  @HostListener('window:resize', []) onResize() {

    if (this.tabletScreenDown && this.isAuth) {

      this.navOpened = false;
      this.sidenavTrigger.emit(this.navOpened);

    }

  }

  /**
   * @this isSearchInputOpened assign value to true
   * @if true @this navOpened assign to false and emit it's value in @this sidenavTrigger
   */
  onOpenSearch() {

    this.isSearchInputOpened = true;

    if (this.navOpened) {

      this.navOpened = false;
      this.sidenavTrigger.emit(this.navOpened);

    }

  }
}
