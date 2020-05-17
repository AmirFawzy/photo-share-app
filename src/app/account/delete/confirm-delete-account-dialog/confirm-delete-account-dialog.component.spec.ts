import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDeleteAccountDialogComponent } from './confirm-delete-account-dialog.component';

describe('ConfirmDeleteAccountDialogComponent', () => {
  let component: ConfirmDeleteAccountDialogComponent;
  let fixture: ComponentFixture<ConfirmDeleteAccountDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfirmDeleteAccountDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmDeleteAccountDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
