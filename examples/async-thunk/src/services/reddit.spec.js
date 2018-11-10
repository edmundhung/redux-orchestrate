import { modelFactory, eventCreatorFactory, thunkFactory } from './reddit';

describe('reddit service', () => {
  describe('modelFactory', () => {
    it('computes the reddit model from modelFactory', () => {
      const state = {
        postsBySubreddit: {
          redux: ['redux post 1', 'redux post 2'],
        },
        fetchingSubreddit: ['react'],
      };
      const model = modelFactory(state);

      expect(Object.keys(model).sort()).toEqual(['getPosts', 'isFetched', 'isFetching'].sort());
      expect(model.getPosts('test')).toEqual([]);
      expect(model.getPosts('redux')).toEqual(['redux post 1', 'redux post 2']);
      expect(model.getPosts('react')).toEqual([]);
      expect(model.isFetched('test')).toEqual(false);
      expect(model.isFetched('redux')).toEqual(true);
      expect(model.isFetched('react')).toEqual(false);
      expect(model.isFetching('test')).toEqual(false);
      expect(model.isFetching('redux')).toEqual(false);
      expect(model.isFetching('react')).toEqual(true);
    });
  });

  describe('eventCreatorFactory', () => {
    let createEvent;
    let reddit;

    beforeEach(() => {
      createEvent = jest.fn(callback => callback({ subreddit: 'test' }));
      reddit = { event1: 'test event 1', event2: 'test event 2' };
    });

    it('passes the raw reddit eventCreators only', () => {
      const eventCreators = eventCreatorFactory(reddit)(createEvent);

      expect(Object.keys(eventCreators)).toEqual(Object.keys(reddit).sort());
    });
  });

  describe('thunkFactory', () => {
    let fetchSpy;
    let response;
    let selector;
    let actionCreators;
    let dispatch;
    let getState;

    beforeAll(() => {
      fetchSpy = jest.spyOn(global, 'fetch');
    });

    afterAll(() => {
      fetchSpy.mockRestore();
    });

    beforeEach(() => {
      response = { json: jest.fn() };
      selector = jest.fn().mockReturnValue('selector()');
      dispatch = jest.fn().mockReturnValue('dispatch()');
      getState = jest.fn().mockReturnValue('getState()');
      actionCreators = {
        requestPost: jest.fn().mockReturnValue('requestPost()'),
        receivePost: jest.fn().mockReturnValue('receivePost()'),
      };

      fetchSpy.mockResolvedValue(response);
    });

    it('makes only 1 thunk', () => {
      const thunk = thunkFactory()(selector, actionCreators);

      expect(Object.keys(thunk).sort()).toEqual(['fetchPosts'].sort());
    });

    it('makes a "fetchPosts" thunk', async () => {
      const isFetching = jest
        .fn()
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      response.json.mockReturnValue({ data: { children: 'test data children' } });
      selector.mockReturnValue({ isFetching });

      const { fetchPosts } = thunkFactory()(selector, actionCreators);

      await fetchPosts('1st')(dispatch, getState);
      expect(selector).toBeCalledTimes(1);
      expect(dispatch).toBeCalledTimes(0);
      expect(selector).toBeCalledWith('getState()');
      expect(isFetching).toBeCalledWith('1st');

      await fetchPosts('2nd')(dispatch, getState);
      expect(selector).toBeCalledTimes(2);
      expect(isFetching).toBeCalledWith('2nd');
      expect(dispatch).toBeCalledWith('requestPost()');
      expect(fetchSpy).toBeCalledWith('https://www.reddit.com/r/2nd.json');
      expect(response.json).toBeCalledTimes(1);
      expect(dispatch).toBeCalledWith('receivePost()');
      expect(actionCreators.receivePost).toBeCalledWith('2nd', 'test data children');
    });
  });
});
