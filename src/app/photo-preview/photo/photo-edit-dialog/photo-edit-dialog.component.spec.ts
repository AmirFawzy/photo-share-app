import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PhotoEditDialogComponent } from './photo-edit-dialog.component';

describe('PhotoEditDialogComponent', () => {
  let component: PhotoEditDialogComponent;
  let fixture: ComponentFixture<PhotoEditDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PhotoEditDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PhotoEditDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
