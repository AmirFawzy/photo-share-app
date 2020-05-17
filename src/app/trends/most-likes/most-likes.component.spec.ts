import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MostLikesComponent } from './most-likes.component';

describe('MostLikesComponent', () => {
  let component: MostLikesComponent;
  let fixture: ComponentFixture<MostLikesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MostLikesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MostLikesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
