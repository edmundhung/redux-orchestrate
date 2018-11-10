import { createAggregate } from '@redux-orchestrate/react-redux';

export const initialState = {
  selected: '',
};

export const eventCreators = {
  select(subreddit) {
    return state => ({
      ...state,
      selected: subreddit,
    });
  },
};

export default createAggregate('app', initialState, eventCreators);
