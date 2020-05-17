import { animation, style, animate, stagger, query } from '@angular/animations';

// fading animation with super flexibe params
export const fadingAnimation = animation([
  style({
    opacity: '{{ opacityStart }}'
  }),
  animate('{{ time }} ease-in-out', style({ opacity: '{{ opacityAnimate }}' }))
]);

// fading animation with stagger, defiend selector and time, easeing params
export const fadingAnimationStagger = animation([
  query(':enter', [
    style({ opacity: 0 }),
    stagger(300, [animate('{{ time }} {{ easing }}', style({ opacity: 1 }))])
  ], { optional: true })
]);

// fading animation function for ultra flexible usage
export function fadingStaggerAnimation(
  selector: string,
  time: string,
  easing: string,
  staggerVal: number,
  opacityStart = 0,
  opacityAnimate = 1
) {
  return animation([
    query(`${selector}`, [
      style({ opacity: `${opacityStart}` }),
      stagger(staggerVal, [animate(`${time} ${easing}`, style({ opacity: `${opacityAnimate}` }))])
    ], { optional: true })
  ]);
}
