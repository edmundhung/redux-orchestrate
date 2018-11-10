import { createService } from '@redux-orchestrate/react-redux';
import { put, call, select } from 'redux-saga/effects';
import redditAggregate from '../aggregates/reddit';
import { fetchRedditPosts } from '../utils/api';

export function modelFactory(state) {
  return {
    getPosts(subreddit) {
      const posts = state.postsBySubreddit[subreddit];

      if (typeof posts === 'undefined') {
        return [];
      }

      return posts;
    },

    isFetched(subreddit) {
      return typeof state.postsBySubreddit[subreddit] !== 'undefined';
    },

    isFetching(subreddit) {
      return state.fetchingSubreddit.indexOf(subreddit) > -1;
    },
  };
}

export function eventCreatorFactory(reddit) {
  return () => reddit;
}

export function sagaFactory() {
  return (selector, actionCreator) => {
    function* fetchPosts(subreddit) {
      const { isFetching } = yield select(selector);

      if (isFetching(subreddit)) {
        return;
      }

      yield put(actionCreator.requestPost(subreddit));
      const posts = yield call(fetchRedditPosts, subreddit);
      yield put(actionCreator.receivePost(subreddit, posts));
    }

    return {
      fetchPosts,
    };
  };
}

export default createService(
  'reddit',
  redditAggregate,
  modelFactory,
  eventCreatorFactory,
  sagaFactory,
);
