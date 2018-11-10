import { initialState, eventCreators } from './reddit';

describe('todo aggregate', () => {
  it('initializes to certain state', () => {
    expect(initialState).toEqual({
      postsBySubreddit: {},
      fetchingSubreddit: [],
    });
  });

  it('exposes 2 event creators', () => {
    expect(Object.keys(eventCreators).sort()).toEqual(['requestPost', 'receivePost'].sort());
  });

  it('handle events properly', () => {
    const event1 = eventCreators.requestPost('react');
    const event2 = eventCreators.requestPost('redux');
    const event3 = eventCreators.receivePost('react', ['post 1', 'post 2']);
    const event4 = eventCreators.receivePost('react', ['post 1', 'post 3']);
    const state1 = event1(initialState);
    const state2 = event2(state1);
    const state3 = event3(state2);
    const state4 = event4(state3);

    expect(state1).toEqual({ postsBySubreddit: {}, fetchingSubreddit: ['react'] });
    expect(state2).toEqual({ postsBySubreddit: {}, fetchingSubreddit: ['react', 'redux'] });
    expect(state3).toEqual({
      postsBySubreddit: { react: ['post 1', 'post 2'] },
      fetchingSubreddit: ['redux'],
    });
    expect(state4).toEqual({
      postsBySubreddit: { react: ['post 1', 'post 3'] },
      fetchingSubreddit: ['redux'],
    });
  });
});
