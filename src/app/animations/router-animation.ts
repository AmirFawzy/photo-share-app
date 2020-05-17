import { trigger, transition, query, style, animate, animateChild, stagger } from '@angular/animations';

export const routerAnimation = trigger('fadeIn', [
  transition('* <=> *', [
    query(':enter', [
      style({
        opacity: 0
      }),
      query('.animate-land-in', [
        style({ opacity: 0, transform: 'translateY(-20px)' })
      ], { optional: true })
    ], { optional: true }),
    query(':leave', [
      style({
        opacity: 1
      }),
      animate('0ms', style({ opacity: 0 }))
    ], { optional: true }),
    query(':enter', [
      style({
        opacity: 0
      }),
      animate('0.5s', style({ opacity: 1 })),
      animateChild(),
      query('.animate-land-in', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        stagger(150, [animate('1s ease-in-out', style({ opacity: 1, transform: 'translateY(0px)' }))])
      ], { optional: true })
    ], { optional: true })
  ])
]);
