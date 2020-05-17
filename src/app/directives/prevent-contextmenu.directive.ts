import { Directive, Renderer2, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[psPreventContextmenu]'
})
export class PreventContextmenuDirective {
  @Input() img: string;   // for background bulring effect
  @Input() ownerName: string;
  @Input() ownerPhoto: string;
  badgeEle: HTMLElement;
  backgroundBlurEle: HTMLElement;

  constructor(private rendrer: Renderer2, private el: ElementRef) { }

  // prevent browser form showing the contextmenu
  @HostListener('contextmenu', ['$event']) onContextmenu(e: MouseEvent) {
    e.preventDefault();
  }

  // build up the whole elements container and inject it in Dom
  @HostListener('mouseenter', ['$event']) onmouseenter(e: MouseEvent) {
    // indicator-badge element
    const badgeEle = this.rendrer.createElement('div');
    this.badgeEle = badgeEle;
    const badgeClass1 = this.rendrer.addClass(badgeEle, 'indicator-badge');
    const badgeClass2 = this.rendrer.addClass(badgeEle, 'position-absolute');

    // background-blur element
    const backgroundBlur = this.rendrer.createElement('div');
    this.backgroundBlurEle = backgroundBlur;
    const backgroundBlurClass1 = this.rendrer.addClass(backgroundBlur, 'background-blur');
    const backgroundBlurClass2 = this.rendrer.addClass(backgroundBlur, 'position-absolute');
    const backgroundBlurStyle = this.rendrer.setStyle(backgroundBlur, 'background-image', `url(${this.img})`);
    const addBackgroundBlurEleToBadgeEle = this.rendrer.appendChild(badgeEle, backgroundBlur);

    // content-container element
    const contentContainerEle = this.rendrer.createElement('div');
    const contentContainerEleClass1 = this.rendrer.addClass(contentContainerEle, 'd-flex');
    const contentContainerEleClass2 = this.rendrer.addClass(contentContainerEle, 'justify-content-between');
    const contentContainerEleClass3 = this.rendrer.addClass(contentContainerEle, 'align-items-center');
    const contentContainerEleClass4 = this.rendrer.addClass(contentContainerEle, 'w-100');
    const contentContainerEleClass5 = this.rendrer.addClass(contentContainerEle, 'h-100');
    const contentContainerEleClass6 = this.rendrer.addClass(contentContainerEle, 'position-relative');
    const addContentContainerEleToBadgeEle = this.rendrer.appendChild(badgeEle, contentContainerEle);

    // figure element
    const figureEle = this.rendrer.createElement('figure');
    const figureEleClass1 = this.rendrer.addClass(figureEle, 'm-0');
    const figureEleClass2 = this.rendrer.addClass(figureEle, 'rounded-circle');
    const figureEleClass3 = this.rendrer.addClass(figureEle, 'h-auto');
    const figureEleStyle1 = this.rendrer.setStyle(figureEle, 'background', `url(${this.ownerPhoto}) center/cover no-repeat`);
    const figureEleStyle2 = this.rendrer.setStyle(figureEle, 'flex', '1 1 13%');
    const addFigureEleToContentContainerEle = this.rendrer.appendChild(contentContainerEle, figureEle);

    // img element
    // const imgEle = this.rendrer.createElement('img');
    // const imgEleClass = this.rendrer.addClass(imgEle, 'img-fluid');
    // const imgEleSrcAttr1 = this.rendrer.setAttribute(imgEle, 'src', this.ownerPhoto);
    // const imgEleSrcAttr2 = this.rendrer.setAttribute(imgEle, 'alt', this.ownerName);
    // const addImgEleToFigureEle = this.rendrer.appendChild(figureEle, imgEle);

    // paragraph element
    const pEle = this.rendrer.createElement('p');
    const pEleClass1 = this.rendrer.addClass(pEle, 'text-white');
    const pEleClass2 = this.rendrer.addClass(pEle, 'm-0');
    const pEleClass3 = this.rendrer.addClass(pEle, 'mat-body-2');
    const pEleStyle1 = this.rendrer.setStyle(pEle, 'flex', '1 1 87%');
    const addTextToPEle = this.rendrer.createText(this.ownerName);
    const insertText = this.rendrer.appendChild(pEle, addTextToPEle);
    const addPEleToContentContainer = this.rendrer.appendChild(contentContainerEle, pEle);

    /**
     * @if dom in fullscreen and not in tablet or mobil screen
     * tell rendrer to @inject the whole container in the dom
     * @else tell rendrer to remove the whole container from the dom
     */
    if (document.fullscreen && (window.innerWidth > 768)) {
      this.rendrer.appendChild(this.el.nativeElement, badgeEle);
    } else {
      this.rendrer.removeChild(this.el.nativeElement, badgeEle);
    }
  }

  // for security to makesure the rendrer will remove the container anyway on mouseleave
  @HostListener('mouseleave') onmouseleave() {
    this.rendrer.removeChild(this.el.nativeElement, this.badgeEle);
  }

  @HostListener('mousemove', ['$event']) onmousemove(e: MouseEvent) {
    if ((this.backgroundBlurEle !== undefined) && (this.badgeEle !== undefined) && document.fullscreen) {
      const backgroundBlurStylePosX = this.rendrer.setStyle(this.backgroundBlurEle, 'background-position-x', `${e.clientX / 2}px`);
      const backgroundBlurStylePosY = this.rendrer.setStyle(this.backgroundBlurEle, 'background-position-y', `${e.clientY / 2}px`);
      const badgeElePosX = this.rendrer.setStyle(this.badgeEle, 'left', `${e.clientX + 5}px`);
      const badgeElePosY = this.rendrer.setStyle(this.badgeEle, 'top', `${e.clientY - 20}px`);
    }

    // @if true - for security to makesure the rendrer will remove the container anyway
    if (!document.fullscreen) {
      this.rendrer.removeChild(this.el.nativeElement, this.badgeEle);
    }

    if ((<HTMLElement> e.target).classList.contains('mat-icon')) {
      this.rendrer.setStyle(this.badgeEle, 'display', 'none');
    } else {
      this.rendrer.setStyle(this.badgeEle, 'display', 'block');
    }
  }
}
