import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BackgroundParallaxDirective } from './background-parallax.directive';
import { DropzoneDirective } from './dropzone.directive';
import { PreventContextmenuDirective } from './prevent-contextmenu.directive';
import { ScrollableDirective } from './scrollable.directive';
import { TextEllipsisDirective } from './text-ellipsis.directive';

@NgModule({
  declarations: [
    BackgroundParallaxDirective,
    DropzoneDirective,
    PreventContextmenuDirective,
    ScrollableDirective,
    TextEllipsisDirective
  ],
  exports: [
    BackgroundParallaxDirective,
    DropzoneDirective,
    PreventContextmenuDirective,
    ScrollableDirective,
    TextEllipsisDirective
  ],
  imports: [
    CommonModule
  ]
})
export class AppDirectivesModule { }
