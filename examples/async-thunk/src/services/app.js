import { createService } from '@redux-orchestrate/react-redux';
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
  });
}

export function thunkFactory(app, reddit) {
  return (selector, actionCreators) => ({
    selectSubreddit(value) {
      return (dispatch, getState) => {
        if (!value) {
          return;
        }

        dispatch(actionCreators.selectSubreddit(value));

        if (!selector(getState()).isFetched) {
          dispatch(reddit.fetchPosts(value));
        }
      };
    },

    invalidateSubreddit() {
      return (dispatch, getState) => {
        const state = getState();
        const { subreddit } = selector(state);

        dispatch(reddit.fetchPosts(subreddit));
      };
    },
  });
}

export function onInitialize(selector, actionCreators, thunk) {
  return thunk;
}

export default createService(
  'app',
  [appAggregate, redditService],
  modelFactory,
  eventCreatorFactory,
  thunkFactory,
  onInitialize,
);
