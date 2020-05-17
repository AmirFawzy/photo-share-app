import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LayoutModule } from '@angular/cdk/layout';

import { MaterialModule } from '../material.module';
import { SwiperModule, SWIPER_CONFIG, SwiperConfigInterface } from 'ngx-swiper-wrapper';
import { UploadDialogModule } from '../upload-dialog/upload-dialog.module';
import { FontIconsModule } from '../shared/font-icons.module';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { HomeComponent } from './home/home.component';
import { UserHomeComponent } from './home/user-home/user-home.component';

const defaultSwiperConfig: SwiperConfigInterface = {
  direction: 'horizontal',
  slidesPerView: 'auto'
};

@NgModule({
  declarations: [
    FooterComponent,
    HeaderComponent,
    HomeComponent,
    UserHomeComponent
  ],
  exports: [
    FooterComponent,
    HeaderComponent,
    HomeComponent,
    UserHomeComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MaterialModule,
    LayoutModule,
    SwiperModule,
    UploadDialogModule,
    FontIconsModule
  ],
  providers: [
    { provide: SWIPER_CONFIG, useValue: defaultSwiperConfig }
  ]
})
export class CoreModule { }
