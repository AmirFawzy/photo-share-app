import { TransformBigNumbersPipe } from './transform-big-numbers.pipe';

describe('TransformBigNumbersPipe', () => {
  it('create an instance', () => {
    const pipe = new TransformBigNumbersPipe();
    expect(pipe).toBeTruthy();
  });
});
