import { Directive, Output, EventEmitter, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appScrollable]'
})
export class ScrollableDirective {
  @Output() scrollPosition = new EventEmitter<string>();

  constructor(public el: ElementRef<HTMLElement>) { }

  @HostListener('scroll', ['$event']) onscroll(evt: Event) {
    try {

      // how much scroll from top
      const top = (<HTMLElement>evt.target).scrollTop;
      // full height of the element content
      const height = this.el.nativeElement.scrollHeight;
      // height of the element
      const offset = this.el.nativeElement.offsetHeight;

      // if scroll exceed the bottom with 1 pixel (emit 'bottom')
      if (top > height - offset - 1) {
        this.scrollPosition.emit('bottom');
      }

      // if scroll hit the top (emit 'top')
      if (top === 0) {
        this.scrollPosition.emit('top');
      }

    } catch (error) {

      console.log(error);

    }
  }
}
