import { Directive, Renderer2, ElementRef, AfterViewInit, Input, OnInit } from '@angular/core';

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[psTextEllipsis]'
})
export class TextEllipsisDirective implements OnInit, AfterViewInit {
  @Input() text: string;
  @Input() ellipsisColor?= 'black';
  private textEleWidth: number;

  constructor(private rendrer: Renderer2, private eleRef: ElementRef) { }

  ngOnInit() {
    const createTextEle = this.rendrer.createElement('span');
    const createTextNode = this.rendrer.createText(this.text);
    const injectTextNode = this.rendrer.appendChild(createTextEle, createTextNode);
    const injectTextEleToThisEle = this.rendrer.appendChild(this.eleRef.nativeElement, createTextEle);
    // const createTextEleStyle1 = this.rendrer.setStyle(createTextEle, 'white-space', 'nowrap');
    const textEleWidth = (<HTMLElement>createTextNode).getBoundingClientRect().width;

    this.textEleWidth = textEleWidth;
  }

  ngAfterViewInit() {
    const thisEleWidth = (<HTMLElement>this.eleRef.nativeElement).getBoundingClientRect().width;

    if (this.textEleWidth > thisEleWidth) {
      const ellipsisDotsEle = this.rendrer.createElement('span');
      const createEllipsisDots = this.rendrer.createText('...');
      const injectDotsInEllipsisDotEle = this.rendrer.appendChild(ellipsisDotsEle, createEllipsisDots);
      const ellipsisDotsEleClass = this.rendrer.addClass(ellipsisDotsEle, 'dots');
      const createEllipsisDotsEleStyle1 = this.rendrer.setStyle(ellipsisDotsEle, 'position', 'absolute');
      const createEllipsisDotsEleStyle2 = this.rendrer.setStyle(ellipsisDotsEle, '-webkit-text-fill-color', this.ellipsisColor);
      const createEllipsisDotsEleStyle3 = this.rendrer.setStyle(ellipsisDotsEle, 'left', `${thisEleWidth - 18}px`);
      const injectEllipsisDotEle = this.rendrer.appendChild(this.eleRef.nativeElement, ellipsisDotsEle);
    }
  }
}
