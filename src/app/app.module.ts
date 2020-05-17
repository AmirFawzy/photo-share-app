import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { LayoutModule } from '@angular/cdk/layout';
import { MaterialModule } from './material.module';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirePerformanceModule } from '@angular/fire/performance';
import { environment } from '../environments/environment';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PerfectScrollbarModule, PERFECT_SCROLLBAR_CONFIG, PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { AccountModule } from './account/account.module';
import { JobsModule } from './jobs/jobs.module';
import { UserProfileModule } from './user-profile/user-profile.module';
import { AppPipesModule } from './pipes/app-pipes.module';
import { AppDirectivesModule } from './directives/app-directives.module';
import { TrendsModule } from './trends/trends.module';
import { SharedModule } from './shared/shared.module';
import { PhotoPreviewModule } from './photo-preview/photo-preview.module';
import { SearchModule } from './search/search.module';
import { CoreModule } from './core/core.module';
import { UploadDialogModule } from './upload-dialog/upload-dialog.module';
import { RegisterPasswordModule } from './register-password/register-password.module';
import { UserNavsModule } from './user-navs/user-navs.module';
import { ServiceWorkerModule } from '@angular/service-worker';

const customScrollbarConfig: PerfectScrollbarConfigInterface = {
  wheelSpeed: 1
};

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialModule,
    LayoutModule,
    PerfectScrollbarModule,
    HttpClientModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireStorageModule,
    AngularFirePerformanceModule,
    AppPipesModule,
    AppDirectivesModule,
    AccountModule,
    JobsModule,
    UserProfileModule,
    TrendsModule,
    SharedModule,
    PhotoPreviewModule,
    SearchModule,
    CoreModule,
    UploadDialogModule,
    RegisterPasswordModule,
    UserNavsModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production, registrationStrategy: 'registerImmediately' })
  ],
  providers: [
    { provide: PERFECT_SCROLLBAR_CONFIG, useValue: customScrollbarConfig }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
