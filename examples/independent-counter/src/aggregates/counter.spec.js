import { initialState, eventCreators } from './counter';

describe('counter aggregate', () => {
  it('initializes to certain state', () => {
    expect(initialState).toEqual(0);
  });

  it('exposes 2 event creator', () => {
    expect(Object.keys(eventCreators).sort()).toEqual(['increment', 'decrement'].sort());
  });

  it('handles event properly', () => {
    const event1 = eventCreators.increment();
    const event2 = eventCreators.increment();
    const event3 = eventCreators.decrement();
    const state1 = event1(initialState);
    const state2 = event2(state1);
    const state3 = event3(state2);

    expect(state1).toEqual(1);
    expect(state2).toEqual(2);
    expect(state3).toEqual(1);
  });
});
