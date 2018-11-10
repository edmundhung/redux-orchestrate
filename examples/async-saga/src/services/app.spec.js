import { takeEvery, select, fork } from 'redux-saga/effects';
import { cloneableGenerator } from 'redux-saga/utils';
import { modelFactory, eventCreatorFactory, sagaFactory, onInitialize } from './app';

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
      createEvent = jest.fn().mockReturnValue('createEvent()');
      app = { select: jest.fn().mockReturnValue('select()') };
    });

    it('makes 2 events', () => {
      const eventCreators = eventCreatorFactory(app)(createEvent);

      expect(Object.keys(eventCreators).sort()).toEqual(
        ['selectSubreddit', 'invalidateSubreddit'].sort(),
      );
    });

    it('makes a "selectSubreddit" event', () => {
      createEvent.mockImplementation(callback => callback({ subreddit: 'test' }));

      const eventCreators = eventCreatorFactory(app)(createEvent);

      expect(eventCreators.selectSubreddit('test')).not.toBeDefined();
      expect(eventCreators.selectSubreddit('dev')).toEqual('select()');
      expect(app.select).toBeCalledWith('dev');
    });

    it('makes a "invaldiateSubreddit" event', () => {
      const eventCreators = eventCreatorFactory(app)(createEvent);

      expect(eventCreators.invalidateSubreddit()).toEqual('createEvent()');
      expect(createEvent).toBeCalledWith();
    });
  });

  describe('sagaFactory', () => {
    let app;
    let reddit;
    let selector;
    let actionCreators;

    beforeEach(() => {
      app = {};
      reddit = { fetchPosts: jest.fn().mockReturnValue('fetchPosts()') };
      selector = jest.fn().mockReturnValue('selector()');
      actionCreators = { selectSubreddit: jest.fn().mockReturnValue('selectSubreddit()') };
    });

    it('makes two saga', () => {
      const saga = sagaFactory(app, reddit)(selector, actionCreators);

      expect(Object.keys(saga).sort()).toEqual(['refreshPosts', 'fetchNewSubreddit'].sort());
    });

    it('makes a "refreshPosts" saga', () => {
      const saga = sagaFactory(app, reddit)(selector, actionCreators);
      const refreshPosts = cloneableGenerator(saga.refreshPosts)();

      expect(refreshPosts.next().value).toEqual(select(selector));
      expect(
        refreshPosts.clone().next({ subreddit: 'test', isFetched: false }).value,
      ).not.toBeDefined();
      expect(refreshPosts.next({ subreddit: 'test', isFetched: true }).value).toEqual(
        fork(reddit.fetchPosts, 'test'),
      );
    });

    it('makes a "fetchNewSubreddit" saga', () => {
      const saga = sagaFactory(app, reddit)(selector, actionCreators);
      const fetchNewSubreddit = cloneableGenerator(saga.fetchNewSubreddit)();

      expect(fetchNewSubreddit.next().value).toEqual(select(selector));
      expect(
        fetchNewSubreddit.clone().next({ subreddit: 'test', isFetched: true }).value,
      ).not.toBeDefined();
      expect(fetchNewSubreddit.next({ subreddit: 'test', isFetched: false }).value).toEqual(
        fork(reddit.fetchPosts, 'test'),
      );
    });
  });

  describe('onInitialize', () => {
    it('runs the saga created with runSaga', () => {
      const sagas = [];
      const runSaga = jest.fn(saga => sagas.push(saga));
      const selector = 'selector';
      const actionCreator = {
        invalidateSubreddit: { toString: jest.fn().mockReturnValue('invalidateSubreddit') },
        selectSubreddit: { toString: jest.fn().mockReturnValue('selectSubreddit') },
      };
      const saga = {
        refreshPosts: jest.fn(),
        fetchNewSubreddit: jest.fn(),
      };

      expect(onInitialize(selector, actionCreator, saga, { runSaga })).not.toBeDefined();
      expect(runSaga).toBeCalledTimes(1);
      expect(sagas).toHaveLength(1);

      const startup = sagas.shift();
      const gen = startup();

      expect(gen.next().value).toEqual(takeEvery('invalidateSubreddit', saga.refreshPosts));
      expect(gen.next().value).toEqual(takeEvery('selectSubreddit', saga.fetchNewSubreddit));
      expect(actionCreator.invalidateSubreddit.toString).toBeCalledTimes(1);
      expect(actionCreator.selectSubreddit.toString).toBeCalledTimes(1);
    });
  });
});
