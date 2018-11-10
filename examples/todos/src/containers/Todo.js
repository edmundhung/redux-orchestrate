import { render } from '@redux-orchestrate/react-redux';
import todoAggregate from '../aggregates/todo';

function selector(todos, command, { id }) {
  const todoIndex = todos.map(todo => todo.id).indexOf(id);
  const todo = todoIndex > -1 ? todos[todoIndex] : null;

  return {
    text: todo ? todo.text : '',
    complete: todo ? todo.complete : false,
    toggle: () => command.toggle(id),
  };
}

export default render(todoAggregate, selector);
