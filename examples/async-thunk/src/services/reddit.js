import { createService } from '@redux-orchestrate/react-redux';
import redditAggregate from '../aggregates/reddit';

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

export function thunkFactory() {
  return (selector, actionCreators) => ({
    fetchPosts(subreddit) {
      return (dispatch, getState) => {
        const state = getState();
        const model = selector(state);
        const isFetching = model.isFetching(subreddit);

        if (isFetching) {
          return;
        }

        dispatch(actionCreators.requestPost(subreddit));

        return fetch(`https://www.reddit.com/r/${subreddit}.json`)
          .then(response => response.json())
          .then(({ data }) => dispatch(actionCreators.receivePost(subreddit, data.children)));
      };
    },
  });
}

export default createService(
  'reddit',
  redditAggregate,
  modelFactory,
  eventCreatorFactory,
  thunkFactory,
);
