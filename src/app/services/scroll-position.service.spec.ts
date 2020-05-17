import { TestBed } from '@angular/core/testing';

import { ScrollPositionService } from './scroll-position.service';

describe('ScrollPositionService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ScrollPositionService = TestBed.get(ScrollPositionService);
    expect(service).toBeTruthy();
  });
});
