import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PostJobDialogComponent } from './post-job-dialog.component';

describe('PostJobDialogComponent', () => {
  let component: PostJobDialogComponent;
  let fixture: ComponentFixture<PostJobDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PostJobDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PostJobDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
