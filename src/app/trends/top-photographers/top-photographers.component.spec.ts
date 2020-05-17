import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TopPhotographersComponent } from './top-photographers.component';

describe('TopPhotographersComponent', () => {
  let component: TopPhotographersComponent;
  let fixture: ComponentFixture<TopPhotographersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TopPhotographersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopPhotographersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
