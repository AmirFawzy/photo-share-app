import { animation, query, style, stagger, animate } from '@angular/animations';

export const fadeInDown = animation([
  query('.animate-in', [
    style({ opacity: 0, transform: 'translateY(-20px)' }),
    stagger(150, [animate('1s ease-in-out', style({ opacity: 1, transform: 'translateY(0px)' }))])
  ], { optional: true })
]);
