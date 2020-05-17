import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReauthenticateDialogComponent } from './reauthenticate-dialog.component';

describe('ReauthenticateDialogComponent', () => {
  let component: ReauthenticateDialogComponent;
  let fixture: ComponentFixture<ReauthenticateDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReauthenticateDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReauthenticateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
