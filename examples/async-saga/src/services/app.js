import { createService } from '@redux-orchestrate/react-redux';
import { fork, select, takeEvery } from 'redux-saga/effects';
import appAggregate from '../aggregates/app';
import redditService from './reddit';

export function modelFactory(app, subreddit) {
  return {
    subreddit: app.selected,
    posts: subreddit.getPosts(app.selected),
    isFetched: subreddit.isFetched(app.selected),
    isFetching: subreddit.isFetching(app.selected),
  };
}

export function eventCreatorFactory(app, reddit) {
  return createEvent => ({
    selectSubreddit(subreddit) {
      const event = createEvent(model => {
        if (model.subreddit === subreddit) {
          return;
        }

        return app.select(subreddit);
      });

      return event;
    },

    invalidateSubreddit() {
      return createEvent();
    },
  });
}

export function sagaFactory(app, reddit) {
  return (selector, actionCreator) => {
    function* refreshPosts() {
      const { subreddit, isFetched } = yield select(selector);

      if (isFetched) {
        yield fork(reddit.fetchPosts, subreddit);
      }
    }

    function* fetchNewSubreddit() {
      const { subreddit, isFetched } = yield select(selector);

      if (!isFetched) {
        yield fork(reddit.fetchPosts, subreddit);
      }
    }

    return {
      refreshPosts,
      fetchNewSubreddit,
    };
  };
}

export function onInitialize(selector, actionCreator, saga, { runSaga }) {
  function* startup() {
    yield takeEvery(`${actionCreator.invalidateSubreddit}`, saga.refreshPosts);
    yield takeEvery(`${actionCreator.selectSubreddit}`, saga.fetchNewSubreddit);
  }

  runSaga(startup);
}

export default createService(
  'app',
  [appAggregate, redditService],
  modelFactory,
  eventCreatorFactory,
  sagaFactory,
  onInitialize,
);
