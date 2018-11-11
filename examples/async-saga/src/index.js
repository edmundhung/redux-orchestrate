import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware, compose } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { defaultReducer, installRegistry, Provider } from '@redux-orchestrate/react-redux';
import App from './containers/App';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const container = document.getElementById('root');
const sagaMiddleware = createSagaMiddleware();
const applyRegistry = installRegistry({
  runSaga(saga) {
    return sagaMiddleware.run(saga);
  },
});
const enhancer = composeEnhancers(applyMiddleware(sagaMiddleware), applyRegistry);

const store = createStore(defaultReducer, {}, enhancer);
const app = (
  <Provider store={store}>
    <App />
  </Provider>
);

ReactDOM.render(app, container);
