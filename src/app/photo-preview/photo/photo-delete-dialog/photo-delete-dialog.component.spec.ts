import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PhotoDeleteDialogComponent } from './photo-delete-dialog.component';

describe('PhotoDeleteDialogComponent', () => {
  let component: PhotoDeleteDialogComponent;
  let fixture: ComponentFixture<PhotoDeleteDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PhotoDeleteDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PhotoDeleteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
