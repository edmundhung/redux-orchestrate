import { createAggregate } from '@redux-orchestrate/react-redux';

export const initialState = [];

export const eventCreators = {
  add(text) {
    return state => state.concat({ id: state.length + 1, text, completed: false });
  },

  toggle(id) {
    return state =>
      state.map(todo => {
        if (todo.id !== id) {
          return todo;
        }

        return {
          ...todo,
          completed: !todo.completed,
        };
      });
  },
};

export default createAggregate('todo', initialState, eventCreators);
