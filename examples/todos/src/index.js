import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, compose } from 'redux';
import { Provider, defaultReducer, installRegistry } from '@redux-orchestrate/react-redux';
import App from './containers/App';

const container = document.getElementById('root');
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const enhancer = composeEnhancers(installRegistry());
const store = createStore(defaultReducer, enhancer);
const app = (
  <Provider store={store}>
    <App />
  </Provider>
);

ReactDOM.render(app, container);
