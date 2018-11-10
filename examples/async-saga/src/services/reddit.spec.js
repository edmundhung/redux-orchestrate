import { call, select, put } from 'redux-saga/effects';
import { cloneableGenerator } from 'redux-saga/utils';
import { modelFactory, eventCreatorFactory, sagaFactory } from './reddit';
import { fetchRedditPosts } from '../utils/api';

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

  describe('sagaFactory', () => {
    let fetchSpy;
    let response;
    let selector;
    let actionCreators;

    beforeAll(() => {
      fetchSpy = jest.spyOn(global, 'fetch');
    });

    afterAll(() => {
      fetchSpy.mockRestore();
    });

    beforeEach(() => {
      response = { json: jest.fn() };
      selector = jest.fn().mockReturnValue('selector()');
      actionCreators = {
        requestPost: jest.fn().mockReturnValue('requestPost()'),
        receivePost: jest.fn().mockReturnValue('receivePost()'),
      };

      fetchSpy.mockResolvedValue(response);
    });

    it('makes only 1 saga', () => {
      const saga = sagaFactory()(selector, actionCreators);

      expect(Object.keys(saga).sort()).toEqual(['fetchPosts'].sort());
    });

    it('makes a "fetchPosts" saga', async () => {
      const isFetching = jest
        .fn()
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);
      const saga = sagaFactory()(selector, actionCreators);
      const fetchPosts = cloneableGenerator(saga.fetchPosts)('subreddit');

      expect(fetchPosts.next().value).toEqual(select(selector));
      expect(fetchPosts.clone().next({ isFetching }).value).not.toBeDefined();
      expect(fetchPosts.next({ isFetching }).value).toEqual(put('requestPost()'));
      expect(fetchPosts.next().value).toEqual(call(fetchRedditPosts, 'subreddit'));
      expect(fetchPosts.next('test').value).toEqual(put('receivePost()'));
      expect(actionCreators.requestPost).toBeCalledWith('subreddit');
      expect(actionCreators.receivePost).toBeCalledWith('subreddit', 'test');
    });
  });
});
