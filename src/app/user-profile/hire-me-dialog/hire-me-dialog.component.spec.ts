import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HireMeDialogComponent } from './hire-me-dialog.component';

describe('HireMeDialogComponent', () => {
  let component: HireMeDialogComponent;
  let fixture: ComponentFixture<HireMeDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HireMeDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HireMeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
