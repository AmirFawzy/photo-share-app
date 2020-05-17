import {
  Component,
  ViewEncapsulation,
  ViewChild,
  OnInit,
  HostListener,
  AfterViewInit,
  ChangeDetectorRef,
  ElementRef,
  OnDestroy
} from '@angular/core';
import { Router, UrlTree, PRIMARY_OUTLET, UrlSegment, UrlSegmentGroup, RouterOutlet } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { MatSidenav } from '@angular/material/sidenav';
import { AngularFireAuth } from '@angular/fire/auth';
import { Subscription, EMPTY, combineLatest } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

import { PerfectScrollbarConfigInterface, PerfectScrollbarComponent } from 'ngx-perfect-scrollbar';
import { UploadDialogComponent } from './upload-dialog/upload-dialog.component';
import { AuthService } from './services/auth.service';
import { UiService } from './services/ui.service';
import { UploadService } from './services/upload.service';
import { UserService } from './services/user.service';
import { User } from './models/user.model';
import { ScrollPositionService } from './services/scroll-position.service';
import { TrendsService, GeneralDataWithUID } from './services/trends.service';
import { routerAnimation } from './animations/router-animation';

@Component({
  selector: 'ps-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [routerAnimation]
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('sideNav', { static: true }) readonly mainSidenav: MatSidenav;
  @ViewChild('userMenu', { static: true }) readonly userMenuNav: MatSidenav;
  @ViewChild('notificationMenu', { static: true }) readonly notificationMenuNav: MatSidenav;
  @ViewChild('moreMenu', { static: true }) readonly moreMenuNav: MatSidenav;
  @ViewChild(PerfectScrollbarComponent, { static: false }) readonly customScrollRef: PerfectScrollbarComponent;
  @ViewChild('customCursor', { static: false }) readonly customCursor: ElementRef<HTMLElement>;
  @ViewChild('cursor', { static: false }) readonly cursor: ElementRef<HTMLElement>;
  @ViewChild('cursorLeftLine', { static: false }) readonly cursorLeftLine: ElementRef<HTMLElement>;
  @ViewChild('cursorRightLine', { static: false }) readonly cursorRightLine: ElementRef<HTMLElement>;
  config: PerfectScrollbarConfigInterface = {};
  wWidth: number;
  wHeight: number;
  isAboveTabletScreen: boolean;
  disableScrollbar = false;
  sidenavWidth: number;
  isTrendsPage = false;   // refere to if url in 'trends' page
  isUserProfilePage = false;    // refer to if url in 'user profile' page
  isRegisterPage = false;   // refer to if url in 'register' page
  isCollectionPage = false;    // refer to if url in 'collection' page
  stickyToolbar = false;    // to set toolbar to be sticky
  isHomePageOpen = false;   // refer to if url in home page
  isUserHomePage = false;   // refer to if url is user home page
  isBelowHeroSlider = false;    // refer to if scroll top passed hero slider
  sidenavCloseAnimate = false;  // to make animate when sidenav close
  cursorName: string;   // refer to custom cursor tooltip text
  isCustomCursorHidden = true;
  isAuth: boolean;
  loadingBarState: boolean;
  userPhoto: string;
  topUsersBadgeColor: string;   // top photographers badge color
  isTop3Users: boolean;   // is user one of top 3 photographers
  isTop10Users: boolean;   // is user one of top 10 photographers
  tabletScreenDown = false;   // below tablet screen 768px and lower
  aboveTabletScreen = false;   // tablet screen 769px and up
  private loadingBarStateSubscription: Subscription;
  private userPhotoSubscription: Subscription = new Subscription();
  private subscriptions: Subscription = new Subscription();

  constructor(
    private router: Router,
    public dialog: MatDialog,
    private cdRef: ChangeDetectorRef,
    private authService: AuthService,
    private uiService: UiService,
    private uploadService: UploadService,
    private userService: UserService,
    private scrollPositionService: ScrollPositionService,
    private trendsService: TrendsService,
    private afAuth: AngularFireAuth,
    private breakpointService: BreakpointObserver
  ) { }

  ngOnInit() {
    this.sidenavWidth = (<any>this.mainSidenav)._elementRef.nativeElement.offsetWidth;

    if (!this.disableScrollbar) {

      this.wWidth = window.innerWidth;
      this.wHeight = window.innerHeight;

    }

    this.authService.intialAuthListener();

    this.authService.authChange.subscribe(isAuth => {

      if (isAuth) {

        this.isAuth = true;

      } else {

        this.isAuth = false;
        this.userMenuNav.close();
        this.notificationMenuNav.close();
        this.moreMenuNav.close();
        this.disableScrollbar = false;
        this.isAboveTabletScreen = false;

      }

      if (this.aboveTabletScreen) {
        this.isAboveTabletScreen = true;
      }

    });

    /**
     * subscribe for loading state
     * @this loadingBarState {boolean} assign to 'loadingState' value
     */
    this.loadingBarStateSubscription = this.uiService.loadingState.subscribe(
      (state: boolean) => {

        this.loadingBarState = state;
        this.cdRef.detectChanges();

      }
    );

    // get user photo for side nav
    this.subscriptions.add(this.authService.authChange.pipe(
      switchMap((isAuth) => {

        if (isAuth) {
          return this.userService.getUserDataForMenu();
        }

        return EMPTY;

      })
    ).subscribe((user: User) => {

      if (user) {
        this.userPhoto = user.userPhoto;
      }

    }));

    this.authService.authChange.pipe(
      switchMap((isAuth) => {

        if (isAuth) {
          return this.trendsService.getTopPhotographersForRatingBadge();
        }

        return EMPTY;

      }),
      map((photographers: GeneralDataWithUID[] | never) => {

        // user uid
        const uid = this.afAuth.auth.currentUser.uid;

        if (photographers) {
          // get current user if exist in top photographers
          const user = photographers.find(photographer => photographer.uid === uid);
          // get current user index (+ 1 cuz index start from 0 wanna make it start from 1)
          const userIdx = photographers.indexOf(user) + 1;

          if (user) {

            switch (userIdx) {
              case 1:
                return 'gold';
                break;
              case 2:
                return 'silver';
                break;
              case 3:
                return 'bronze';
                break;
              case 4:
              case 5:
              case 6:
              case 7:
              case 8:
              case 9:
              case 10:
                return 'top 10';
                break;
              default:
                return 'top 10';
            }

          } else {

            return;

          }

        }

      })
    ).subscribe(result => {

      if (result === 'gold') {

        this.topUsersBadgeColor = '#FEE101';
        this.isTop3Users = true;

      } else if (result === 'silver') {

        this.topUsersBadgeColor = '#A77044';
        this.isTop3Users = true;

      } else if (result === 'bronze') {

        this.topUsersBadgeColor = '#A77044';
        this.isTop3Users = true;

      } else if (result === 'top 10') {

        this.topUsersBadgeColor = '';
        this.isTop10Users = true;

      } else if (typeof result === 'undefined') {

        this.isTop3Users = false;
        this.isTop10Users = false;

      }

    });

    this.breakpointService
      .observe(['(max-width: 768px)', '(min-width: 769px)'])
      .subscribe(state => {

        if (state.breakpoints['(max-width: 768px)']) {

          this.tabletScreenDown = true;
          this.aboveTabletScreen = false;

          if (this.isAuth) {
            this.mainSidenav.close();
            this.sidenavCloseAnimate = true;
          }

        } else if (state.breakpoints['(min-width: 769px)']) {

          this.aboveTabletScreen = true;
          this.tabletScreenDown = false;

          if (this.isAuth) {
            this.mainSidenav.open();
            this.sidenavCloseAnimate = false;
          }

        } else {

          this.tabletScreenDown = false;
          this.aboveTabletScreen = false;

        }

      });
  }

  ngAfterViewInit() {
    // close the sidenav by default if screen equal and less than 768px
    if (this.tabletScreenDown) {

      this.mainSidenav.close();
      this.sidenavCloseAnimate = true;

    }

    if (this.aboveTabletScreen && this.isAuth) {

      this.mainSidenav.open();
      this.sidenavCloseAnimate = false;

    }

    this.cdRef.detectChanges();
  }

  // on window resize change the width and the height of the custom scrollbar
  @HostListener('window:resize', []) onWResize() {

    if (!this.disableScrollbar) {

      this.wWidth = window.innerWidth;
      this.wHeight = window.innerHeight;

    }

    // reset the view to default margin anyway (look to HTML to understand)
    this.isAboveTabletScreen = false;

    this.cdRef.detectChanges();

  }

  /**
   * on scroll when user scroll
   * @param evt the scroll event holds all access to scroll event properties
   * @const url is the url address
   * @const tree <UrlTree> parsed url tree
   * @const segmentGroup <UrlSegmentGroup> extract url segment group
   * @if true - indeed the user in home page
   * @const scrollTop <number> holds the value that been scrolled from top
   * @const heroSliderHeight <number> the height of the [.hero-slider] element
   * @if true - scroll passed the [.hero-slider] reassign @this isBelowHeroSlider to true
   * @else false reassign @this isBelowHeroSlider to false
   */
  scrolled(evt) {

    const url = this.router.url;
    const tree: UrlTree = this.router.parseUrl(url);  // parsed URL tree
    const segmentsGroup: UrlSegmentGroup = tree.root.children[PRIMARY_OUTLET];  // extract URL segments group

    if (!this.isAuth && (url === '/') && (typeof segmentsGroup === 'undefined')) {

      const scrollTop: number = this.customScrollRef.directiveRef.geometry().y;
      const heroSliderHeight: number = <number>(<HTMLElement>document.querySelector('.hero-slider')).clientHeight;

      if (scrollTop > (heroSliderHeight - 64)) {
        this.isBelowHeroSlider = true;
      } else {
        this.isBelowHeroSlider = false;
      }

    }

    // fire infinity scroll to load more (docs from db)
    // when user hit the [bottom] of (user home page)
    if (this.isAuth
      && (url === '/')
      && (typeof segmentsGroup === 'undefined')
      && (evt.type === 'ps-y-reach-end')) {

      this.scrollPositionService.scrollPosition.next('bottom');

    }

    this.cdRef.detectChanges(); // is nessaccery to detect any changes on every scroll

  }

  onActive(evt) {

    // scroll to the top of the page
    this.customScrollRef.directiveRef.scrollToTop();

    // on route cahnge close all menus and show the custom scrollbar
    this.userMenuNav.close();
    this.notificationMenuNav.close();
    this.moreMenuNav.close();
    this.disableScrollbar = false;

    const url = this.router.url;
    const tree: UrlTree = this.router.parseUrl(url);  // parsed URL tree
    const segmentsGroup: UrlSegmentGroup = tree.root.children[PRIMARY_OUTLET];  // extract URL segments group

    // check if the URL contains a fragment called 'comments' and scroll to it
    if (tree.fragment === 'comments') {

      const ele = <HTMLElement>document.querySelector('#' + tree.fragment);

      setTimeout(() => {
        this.customScrollRef.directiveRef.scrollTo(0, ele.offsetTop);
      }, 100);

    }

    /**
     * @if true the URL has children
     * extract the segments from URL
     * @if true the segment is 'trends' to reassign the boolean value
     */
    if (segmentsGroup) {

      const segments: UrlSegment[] = segmentsGroup.segments;  // extract URL segments
      const [trendsPage] = segments;  // destructuring the array of segments

      (trendsPage.path === 'trends') ? this.isTrendsPage = true : this.isTrendsPage = false;

    }

    /**
     * @if true the URL has children
     * extract the segments from URL
     * @if true the segment is 'profile' to reassign the boolean value
     */
    if (segmentsGroup) {

      const segments: UrlSegment[] = segmentsGroup.segments;  // extract URL segments
      const [userProfilePage,] = segments;  // destructuring the array of segments

      (userProfilePage.path === 'profile') ? this.isUserProfilePage = true : this.isUserProfilePage = false;

    }

    /**
     * @if true the URL has children
     * extract the segments from URL
     * @if true the segment is 'register' to reassign the boolean value
     */
    if (segmentsGroup) {

      const segments: UrlSegment[] = segmentsGroup.segments;  // extract URL segments
      const [userProfilePage,] = segments;  // destructuring the array of segments

      (userProfilePage.path === 'register') ? this.isRegisterPage = true : this.isRegisterPage = false;

    }

    /**
     * why subscribing her? to trigger the @if condition every time auth changes
     * @if true and @if user not authenticated
     * reassign the value of @this stickyToolbar to true @else false
     */
    this.authService.authChange.subscribe(() => {

      if ((url === '/') && (typeof segmentsGroup === 'undefined') && !this.isAuth) {

        this.stickyToolbar = true;

      } else {

        this.stickyToolbar = false;

      }

      // if true reassign the value of [isUserHomePage] to true @else false
      if (this.isAuth && (url === '/') && (typeof segmentsGroup === 'undefined')) {

        this.isUserHomePage = true;

      } else {

        this.isUserHomePage = false;

      }

    });

    // @if true reassign the value of @this isHomePageOpen to true @else false
    if ((url === '/') && (typeof segmentsGroup === 'undefined')) {

      this.isHomePageOpen = true;

    } else {

      this.isHomePageOpen = false;

    }

    /**
     * @if true the URL has children
     * extract the segments from URL
     * @if true the segment is 'collection' to reassign the boolean value
     */
    if (segmentsGroup) {

      const segments: UrlSegment[] = segmentsGroup.segments;  // extract URL segments
      const collectionSegment = segments[2];

      if (collectionSegment) {

        (collectionSegment.path === 'collection') ? this.isCollectionPage = true : this.isCollectionPage = false;

      } else {

        this.isCollectionPage = false;

      }

    }
  }

  private breakpointIsMatched(breakpoint: string, prefix = 'max'): boolean {
    return this.breakpointService.isMatched(`(${prefix}-width: ${breakpoint})`);
  }

  // open upload photos dialog
  openUploadDialog() {

    const dialogRef = this.dialog.open(UploadDialogComponent, {
      backdropClass: 'backdrop',
      closeOnNavigation: true,
      autoFocus: false
    });

    if (this.breakpointIsMatched('480px')) {
      dialogRef.updateSize('88vw');
    } else if (this.breakpointIsMatched('768px')) {
      dialogRef.updateSize('80vw');
    } else if (this.breakpointIsMatched('992px')) {
      dialogRef.updateSize('70vw');
    } else if (this.breakpointIsMatched('1200px')) {
      dialogRef.updateSize('60vw');
    } else if (this.breakpointIsMatched('1201px', 'min')) {
      dialogRef.updateSize('1100px');
    }

    dialogRef.afterClosed().subscribe((isSubmited: boolean) => {

      if (isSubmited) {

        this.uploadService.onSubmitUploadedPhotos();

      } else if (typeof isSubmited === 'undefined' || false) {

        this.uploadService.onUnsubmit();

      }

    });

  }

  /**
   * @param isOpened <boolean> value from emitted event
   * @if true open the sidenav
   * @else close the sidenav
   */
  openSidenav(isOpened: boolean) {

    if (isOpened) {

      this.mainSidenav.open();

      if (window.innerWidth <= 768) {
        this.sidenavCloseAnimate = false;
      }

    } else {

      this.mainSidenav.close();

      if (window.innerWidth <= 768) {
        this.sidenavCloseAnimate = true;
      }

    }

  }

  /**
   * on mousemove on document
   * @param {MouseEvent} evt to tracking the mouse axies
   * @const {Object} mousePos holds mouse coordinates
   * @const {HTMLElement} eleName it holds the attr holds the text attended to appeare in cursor text label
   * @this {string} cursorName is the cursor text label
   * set the style.top of @this customCursor to follow the mouse position Y
   * set the style.left of @this customCursor to follow the mouse position X
   * reassign @this cursorName value
   */
  @HostListener('document:mousemove', ['$event']) onmousemove(evt: MouseEvent) {

    const mousePos = {
      x: evt.clientX,
      y: evt.clientY
    };
    const eleName = (<HTMLElement>evt.target).getAttribute('data-ele-name');
    const eleColor = (<HTMLElement>evt.target).getAttribute('data-ele-color');

    this.customCursor.nativeElement.style.top = `${mousePos.y - (this.cursor.nativeElement.clientHeight / 2)}px`;
    this.customCursor.nativeElement.style.left = `${mousePos.x - (this.cursor.nativeElement.clientWidth / 2)}px`;
    this.cursorName = eleName;

    // detect if [eleName] exist add class else remove it
    if (eleName === 'Open') {

      this.cursor.nativeElement.classList.add('data-ele-name-exist');

    } else {

      this.cursor.nativeElement.classList.remove('data-ele-name-exist');

    }

    // detect if [eleColor] exist add class else remove it
    switch (eleColor) {
      case 'primary':
        this.cursor.nativeElement.classList.add('data-ele-color-primary');
        this.cursor.nativeElement.classList.remove('data-ele-color-secondary');
        break;
      case 'secondary':
        this.cursor.nativeElement.classList.add('data-ele-color-secondary');
        this.cursor.nativeElement.classList.remove('data-ele-color-primary');
        break;
      default:
        this.cursor.nativeElement.classList.remove('data-ele-color-secondary');
        this.cursor.nativeElement.classList.remove('data-ele-color-primary');
        break;
    }

    // check if [localName] is 'a' or 'button'
    if ((<HTMLElement>evt.target).localName === 'a'
      || (<HTMLElement>evt.target).localName === 'button') {

      this.cursor.nativeElement.style.transform = 'scale(1.5)';

      // check if [offsetParrent] exist and if the [localName] is 'a' or 'button'
    } else if ((<HTMLElement>evt.target).offsetParent) {

      if (((<HTMLElement>evt.target).offsetParent.localName === 'a')
        || ((<HTMLElement>evt.target).offsetParent.localName === 'button')) {

        this.cursor.nativeElement.style.transform = 'scale(1.5)';

      } else {

        this.cursor.nativeElement.style.transform = 'scale(1)';

      }
    } else {

      this.cursor.nativeElement.style.transform = 'scale(1)';

    }
  }

  // to make mouse custom cursor move with mouse on drag
  @HostListener('document:drag', ['$event']) ondrag(evt: MouseEvent) {

    const mousePos = {
      x: evt.clientX,
      y: evt.clientY
    };
    const eleName = (<HTMLElement>evt.target).getAttribute('data-ele-name');
    const eleColor = (<HTMLElement>evt.target).getAttribute('data-ele-color');

    this.customCursor.nativeElement.style.top = `${mousePos.y - (this.cursor.nativeElement.clientHeight / 2)}px`;
    this.customCursor.nativeElement.style.left = `${mousePos.x - (this.cursor.nativeElement.clientWidth / 2)}px`;
    this.cursorName = eleName;

    // detect if [eleName] exist add class else remove it
    if (eleName) {

      this.cursor.nativeElement.classList.add('data-ele-name-exist');

    } else {

      this.cursor.nativeElement.classList.remove('data-ele-name-exist');

    }

    // detect if [eleColor] exist add class else remove it
    switch (eleColor) {
      case 'primary':
        this.cursor.nativeElement.classList.add('data-ele-color-primary');
        this.cursor.nativeElement.classList.remove('data-ele-color-secondary');
        break;
      case 'secondary':
        this.cursor.nativeElement.classList.add('data-ele-color-secondary');
        this.cursor.nativeElement.classList.remove('data-ele-color-primary');
        break;
      default:
        this.cursor.nativeElement.classList.remove('data-ele-color-secondary');
        this.cursor.nativeElement.classList.remove('data-ele-color-primary');
        break;
    }
  }

  // on mouse enter show the custom cursor
  @HostListener('body:mouseenter') onmouseenter() {
    this.isCustomCursorHidden = false;
  }

  // on mouseleave hide the custom cursor
  @HostListener('body:mouseleave') onmouseleave() {
    this.isCustomCursorHidden = true;
  }

  // on click down show both lines of the custom cursor
  @HostListener('document:mousedown') onmousedown() {
    this.cursorLeftLine.nativeElement.style.opacity = '1';
    this.cursorRightLine.nativeElement.style.opacity = '1';
    this.cursorLeftLine.nativeElement.style.left = '-13px';
    this.cursorRightLine.nativeElement.style.right = '-13px';
    this.cursor.nativeElement.style.transform = 'scale(1.3)';
  }

  // on click up hide both lines of the custom cursor
  @HostListener('document:mouseup') onmouseup() {

    this.cursorLeftLine.nativeElement.style.left = '0px';
    this.cursorRightLine.nativeElement.style.right = '0px';

    setTimeout(() => {
      this.cursorLeftLine.nativeElement.style.opacity = '0';
      this.cursorRightLine.nativeElement.style.opacity = '0';
    }, 100);

    this.cursor.nativeElement.style.transform = 'scale(1)';
  }

  // on drag end hide both lines of the custom cursor
  @HostListener('document:dragend') ondragend() {

    this.cursorLeftLine.nativeElement.style.left = '0px';
    this.cursorRightLine.nativeElement.style.right = '0px';

    setTimeout(() => {
      this.cursorLeftLine.nativeElement.style.opacity = '0';
      this.cursorRightLine.nativeElement.style.opacity = '0';
    }, 100);

  }

  routeAnimate(outlet: RouterOutlet): boolean {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }

  ngOnDestroy() {
    this.loadingBarStateSubscription.unsubscribe();
    this.userPhotoSubscription.unsubscribe();
  }
}
