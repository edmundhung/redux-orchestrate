import { modelFactory, eventCreatorFactory, thunkFactory, onInitialize } from './app';

describe('app service', () => {
  describe('modelFactory', () => {
    it('computes the app model from modelFactory', () => {
      const app = { selected: 'test' };
      const subreddit = {
        getPosts: jest.fn().mockReturnValue('getPosts()'),
        isFetched: jest.fn().mockReturnValue('isFetched()'),
        isFetching: jest.fn().mockReturnValue('isFetching()'),
      };
      const expected = {
        subreddit: 'test',
        posts: 'getPosts()',
        isFetched: 'isFetched()',
        isFetching: 'isFetching()',
      };

      expect(modelFactory(app, subreddit)).toEqual(expected);
      expect(subreddit.getPosts).toBeCalledWith('test');
      expect(subreddit.isFetched).toBeCalledWith('test');
      expect(subreddit.isFetching).toBeCalledWith('test');
    });
  });

  describe('eventCreatorFactory', () => {
    let createEvent;
    let app;

    beforeEach(() => {
      createEvent = jest.fn(callback => callback({ subreddit: 'test' }));
      app = { select: jest.fn().mockReturnValue('select()') };
    });

    it('makes only 1 event', () => {
      const eventCreators = eventCreatorFactory(app)(createEvent);

      expect(Object.keys(eventCreators).sort()).toEqual(['selectSubreddit'].sort());
    });

    it('makes a "selectSubreddit" event', () => {
      const eventCreators = eventCreatorFactory(app)(createEvent);

      expect(eventCreators.selectSubreddit('test')).not.toBeDefined();
      expect(eventCreators.selectSubreddit('dev')).toEqual('select()');
      expect(app.select).toBeCalledWith('dev');
    });
  });

  describe('thunkFactory', () => {
    let app;
    let reddit;
    let selector;
    let actionCreators;
    let dispatch;
    let getState;

    beforeEach(() => {
      app = {};
      reddit = { fetchPosts: jest.fn().mockReturnValue('fetchPosts()') };
      selector = jest.fn().mockReturnValue('selector()');
      actionCreators = { selectSubreddit: jest.fn().mockReturnValue('selectSubreddit()') };
      dispatch = jest.fn().mockReturnValue('dispatch()');
      getState = jest.fn().mockReturnValue('getState()');
    });

    it('makes two thunks', () => {
      const thunk = thunkFactory(app, reddit)(selector, actionCreators);

      expect(Object.keys(thunk).sort()).toEqual(['selectSubreddit', 'invalidateSubreddit'].sort());
    });

    it('makes a "selectSubreddit" thunk', () => {
      selector.mockReturnValueOnce({ isFetched: true }).mockReturnValueOnce({ isFetched: false });

      const { selectSubreddit } = thunkFactory(app, reddit)(selector, actionCreators);

      selectSubreddit('1st')(dispatch, getState);
      expect(dispatch).toBeCalledTimes(1);
      expect(dispatch).toBeCalledWith('selectSubreddit()');
      expect(dispatch).not.toBeCalledWith('fetchPosts()');
      expect(selector).toBeCalledTimes(1);
      expect(selector).toBeCalledWith('getState()');

      selectSubreddit()(dispatch, getState);
      expect(dispatch).toBeCalledTimes(1);
      expect(selector).toBeCalledTimes(1);

      selectSubreddit('2nd')(dispatch, getState);
      expect(dispatch).toBeCalledTimes(3);
      expect(selector).toBeCalledTimes(2);
      expect(dispatch).toBeCalledWith('fetchPosts()');
    });

    it('makes a "invalidateSubreddit" thunk', () => {
      selector
        .mockReturnValueOnce({ subreddit: 'test subreddit 1' })
        .mockReturnValueOnce({ subreddit: 'test subreddit 2' });

      const { invalidateSubreddit } = thunkFactory(app, reddit)(selector, actionCreators);

      invalidateSubreddit()(dispatch, getState);
      expect(dispatch).toBeCalledWith('fetchPosts()');
      expect(reddit.fetchPosts).toBeCalledWith('test subreddit 1');
      expect(reddit.fetchPosts).not.toBeCalledWith('test subreddit 2');

      invalidateSubreddit()(dispatch, getState);
      expect(reddit.fetchPosts).toBeCalledWith('test subreddit 2');
    });
  });

  describe('onInitialize', () => {
    it('overrides the result action creators with thunks', () => {
      expect(onInitialize('selector', 'actionCreators', 'thunk')).toEqual('thunk');
    });
  });
});
