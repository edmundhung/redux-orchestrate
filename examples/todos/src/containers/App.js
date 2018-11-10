import React from 'react';
import { connect } from '@redux-orchestrate/react-redux';
import appService from '../services/app';
import TodoList from '../components/TodoList';
import TodoForm from '../components/TodoForm';
import Filters from '../components/Filters';

export function App({ todoIds, create }) {
  return (
    <div>
      <div>
        <TodoForm onSubmit={create} />
      </div>
      <div>
        <TodoList todoIds={todoIds} />
      </div>
      <div>
        <Filters />
      </div>
    </div>
  );
}

export function selector(state, command) {
  return {
    todoIds: state.todoIds,
    create: command.create,
  };
}

export default connect(
  appService,
  selector,
)(App);
