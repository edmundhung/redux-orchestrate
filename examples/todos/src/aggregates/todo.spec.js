import { initialState, eventCreators } from './todo';

describe('todo aggregate', () => {
  it('initializes to certain state', () => {
    expect(initialState).toEqual([]);
  });

  it('exposes 2 event creators', () => {
    expect(Object.keys(eventCreators).sort()).toEqual(['add', 'toggle'].sort());
  });

  it('handles events properly', () => {
    const event1 = eventCreators.add('test');
    const event2 = eventCreators.toggle(1);
    const event3 = eventCreators.add('test again');
    const event4 = eventCreators.toggle(3);
    const event5 = eventCreators.toggle(1);

    const state1 = event1(initialState);
    const state2 = event2(state1);
    const state3 = event3(state2);
    const state4 = event4(state3);
    const state5 = event5(state4);

    expect(state1).toEqual([{ id: 1, text: 'test', completed: false }]);
    expect(state2).toEqual([{ id: 1, text: 'test', completed: true }]);
    expect(state3).toEqual([
      { id: 1, text: 'test', completed: true },
      { id: 2, text: 'test again', completed: false },
    ]);
    expect(state4).toEqual([
      { id: 1, text: 'test', completed: true },
      { id: 2, text: 'test again', completed: false },
    ]);
    expect(state5).toEqual([
      { id: 1, text: 'test', completed: false },
      { id: 2, text: 'test again', completed: false },
    ]);
  });
});
