import { createService } from '@redux-orchestrate/react-redux';
import visibilityFilterAggregate, { filters } from '../aggregates/visibilityFilter';
import todoAggregate from '../aggregates/todo';

export function modelFactory(todos, visibilityFilter) {
  return {
    get list() {
      switch (visibilityFilter) {
        case filters.SHOW_ALL:
          return todos;
        case filters.SHOW_COMPLETED:
          return todos.filter(t => t.completed);
        case filters.SHOW_ACTIVE:
          return todos.filter(t => !t.completed);
        default:
          throw new Error('Unknown filter: ' + visibilityFilter);
      }
    },

    get todoIds() {
      return this.list.map(todo => todo.id);
    },
  };
}

export function eventCreatorFactory(todo, visibilityFilter) {
  return createEvent => {
    const create = text => createEvent([todo.add(text), visibilityFilter.set(filters.SHOW_ALL)]);

    return {
      create,
    };
  };
}

export default createService(
  'app',
  [todoAggregate, visibilityFilterAggregate],
  modelFactory,
  eventCreatorFactory,
);
