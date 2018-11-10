import { createAggregate } from '@redux-orchestrate/react-redux';

export const initialState = 0;

export const eventCreators = {
  increment() {
    return state => state + 1;
  },

  decrement() {
    return state => state - 1;
  },
};

export default createAggregate('counter', initialState, eventCreators);
