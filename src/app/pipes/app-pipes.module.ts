import { NgModule } from '@angular/core';

import { TransformBigNumbersPipe } from './transform-big-numbers.pipe';

@NgModule({
  declarations: [TransformBigNumbersPipe],
  exports: [TransformBigNumbersPipe]
})
export class AppPipesModule { }
