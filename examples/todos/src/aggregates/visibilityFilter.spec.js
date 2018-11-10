import { initialState, eventCreators, filters } from './visibilityFilter';

describe('visibilityFilter aggregate', () => {
  it('initializes to certain state', () => {
    expect(initialState).toEqual(filters.SHOW_ALL);
  });

  it('exposes only 1 event creator', () => {
    expect(Object.keys(eventCreators).sort()).toEqual(['set'].sort());
  });

  it('handles events properly', () => {
    const event1 = eventCreators.set(filters.SHOW_ACTIVE);
    const event2 = eventCreators.set(filters.SHOW_COMPLETED);
    const event3 = eventCreators.set('something else');
    const event4 = eventCreators.set(filters.SHOW_COMPLETED);
    const state1 = event1(initialState);
    const state2 = event2(state1);
    const state3 = event3(state2);
    const state4 = event4(state3);

    expect(state1).toEqual(filters.SHOW_ACTIVE);
    expect(state2).toEqual(filters.SHOW_COMPLETED);
    expect(state3).toEqual(filters.SHOW_COMPLETED);
    expect(state4).toEqual(filters.SHOW_COMPLETED);
  });
});
