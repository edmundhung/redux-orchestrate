import { createAggregate } from '@redux-orchestrate/react-redux';

export const initialState = {
  postsBySubreddit: {},
  fetchingSubreddit: [],
};

export const eventCreators = {
  requestPost(subreddit) {
    return state => {
      return {
        ...state,
        fetchingSubreddit: state.fetchingSubreddit.concat(subreddit),
      };
    };
  },

  receivePost(subreddit, posts) {
    return state => ({
      ...state,
      postsBySubreddit: {
        ...state.postsBySubreddit,
        [subreddit]: posts,
      },
      fetchingSubreddit: state.fetchingSubreddit.filter(r => r !== subreddit),
    });
  },
};

export default createAggregate('reddit', initialState, eventCreators);
