import { Directive, Renderer2, ElementRef, HostListener, Input, Inject, AfterViewInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { fromEvent } from 'rxjs';

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[psBackgroundParallax]'
})
export class BackgroundParallaxDirective implements AfterViewInit {
  @Input() parallaxSpeed: number; // speed must be > -.0002
  @Input() highContainer: string; // to specify the container wrap the whole page (if there's any)
  containerElem: HTMLElement;

  constructor(
    private renderer: Renderer2,
    private ele: ElementRef,
    @Inject(DOCUMENT) private document: Document
  ) { }

  ngAfterViewInit() {
    this.containerElem = this.document.querySelector(this.highContainer);
    const ele = this.containerElem;

    /**
      * because this app using custom scroll bar
      * trigger the scroll event on the element wrapping whole page content
      * this element is the scrolling parent for the page content not the WINDOW
      * when scrolling in this element fire the following code
      */
    fromEvent(ele, 'scroll').subscribe(() => {
      const wScrollY = this.containerElem.scrollTop;
      const wInnerHeight = this.containerElem.clientHeight;
      const wInnerWidth = this.containerElem.clientWidth;
      const eleOffsetT = this.ele.nativeElement.offsetTop;
      const eleOffsetH = this.ele.nativeElement.offsetHeight;
      const elemFromTop = eleOffsetT + eleOffsetH + 64;
      // const eleHeight = this.ele.nativeElement.clientHeight;
      const eleHeight = this.ele.nativeElement.getBoundingClientRect().top;

      if ((wScrollY + wInnerHeight) >= (elemFromTop / 3) && (wInnerWidth > 1150)) {
        this.renderer.setStyle(this.ele.nativeElement, 'background-position-y', eleHeight / (wScrollY * this.parallaxSpeed) + 'px');
      }
    });
  }


  /**
   * this app using custom scroll bar to implement scrolling behaviour
   * the scrolling parent not the window, custom scroll bar handling this by normal DOM element wrap all page content
   * the code below working only in case the window is the scrolling parent of the document
   */
  /*@HostListener('window:scroll', []) parallaxScroll() {
    const wScrollY = window.scrollY;
    const wInnerHeight = window.innerHeight;
    const wInnerWidth = window.innerWidth;
    const eleOffsetT = this.ele.nativeElement.offsetTop;
    const eleOffsetH = this.ele.nativeElement.offsetHeight;
    const elemFromTop = eleOffsetT + eleOffsetH + 64;
    const eleHeight = this.ele.nativeElement.clientHeight;

    if ((wScrollY + wInnerHeight) >= (elemFromTop / 3) && (wInnerWidth > 1150)) {
      this.renderer.setStyle(this.ele.nativeElement, 'background-position-y', eleHeight / (wScrollY * this.parallaxSpeed) + 'px');
    }
  }*/
}
