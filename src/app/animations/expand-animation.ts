import { animation, style, stagger, animate } from '@angular/animations';

export const expandAnimation = animation([
  style({
    opacity: 0,
    width: 0,
    transform: 'translateX(-30px)'
  }),
  stagger(300, [
    animate('2s cubic-bezier(0.645, 0.045, 0.355, 1)', style({
      opacity: 1,
      width: '*',
      transform: 'translateX(0)'
    }))
  ])
]);
