import { createAggregate } from '@redux-orchestrate/react-redux';

export const filters = {
  SHOW_ALL: 'SHOW_ALL',
  SHOW_COMPLETED: 'SHOW_COMPLETED',
  SHOW_ACTIVE: 'SHOW_ACTIVE',
};

export const initialState = filters.SHOW_ALL;

export const eventCreators = {
  set(filter) {
    return state => (typeof filters[filter] === 'undefined' || state === filter ? state : filter);
  },
};

export default createAggregate('visibilityFilter', initialState, eventCreators);
