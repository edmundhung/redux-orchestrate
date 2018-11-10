import { initialState, eventCreators } from './app';

describe('todo aggregate', () => {
  it('initializes to certain state', () => {
    expect(initialState).toEqual({ selected: '' });
  });

  it('exposes only 1 event creator', () => {
    expect(Object.keys(eventCreators).sort()).toEqual(['select'].sort());
  });

  it('handles event properly', () => {
    const event1 = eventCreators.select('test once');
    const event2 = eventCreators.select('try something');
    const event3 = eventCreators.select('test again');
    const state1 = event1(initialState);
    const state2 = event2(state1);
    const state3 = event3(state2);

    expect(state1).toEqual({ selected: 'test once' });
    expect(state2).toEqual({ selected: 'try something' });
    expect(state3).toEqual({ selected: 'test again' });
  });
});
