import { createLocalId } from './ids';

describe('createLocalId', () => {
  it('includes the requested prefix and unique suffix parts', () => {
    jest.spyOn(Date, 'now').mockReturnValue(123456789);
    jest.spyOn(Math, 'random').mockReturnValue(0.123456789);

    expect(createLocalId('todo')).toMatch(/^todo_[a-z0-9]+_[a-z0-9]+$/);
  });
});

