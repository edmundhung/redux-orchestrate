import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, compose } from 'redux';
import { installRegistry, Provider } from '@redux-orchestrate/react-redux';
import reducer from './reducer';
import OldCounter from './containers/OldCounter';
import NewCounter from './containers/NewCounter';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const container = document.getElementById('root');
const enhancer = composeEnhancers(installRegistry());

const store = createStore(reducer, enhancer);
const app = (
  <Provider store={store}>
    <React.Fragment>
      <OldCounter />
      <NewCounter />
    </React.Fragment>
  </Provider>
);

ReactDOM.render(app, container);
