import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareBtnsDialogComponent } from './share-btns-dialog.component';

describe('ShareBtnsDialogComponent', () => {
  let component: ShareBtnsDialogComponent;
  let fixture: ComponentFixture<ShareBtnsDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShareBtnsDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShareBtnsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
