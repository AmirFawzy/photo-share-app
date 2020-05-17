import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadUserPhotoDialogComponent } from './upload-user-photo-dialog.component';

describe('UploadUserPhotoDialogComponent', () => {
  let component: UploadUserPhotoDialogComponent;
  let fixture: ComponentFixture<UploadUserPhotoDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UploadUserPhotoDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadUserPhotoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
