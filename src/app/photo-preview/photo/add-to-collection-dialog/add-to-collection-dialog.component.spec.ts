import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddToCollectionDialogComponent } from './add-to-collection-dialog.component';

describe('AddToCollectionDialogComponent', () => {
  let component: AddToCollectionDialogComponent;
  let fixture: ComponentFixture<AddToCollectionDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddToCollectionDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddToCollectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
