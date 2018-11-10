import React from 'react';
import Todo from '../containers/Todo';

function TodoItem({ id, text, completed, toggle }) {
  return (
    <li
      onClick={toggle}
      style={{
        textDecoration: completed ? 'line-through' : 'none',
      }}
    >
      {text}
    </li>
  );
}

function TodoList({ todoIds }) {
  return (
    <ul>
      {todoIds.map(todoId => (
        <Todo key={todoId} id={todoId} component={TodoItem} />
      ))}
    </ul>
  );
}

export default TodoList;
