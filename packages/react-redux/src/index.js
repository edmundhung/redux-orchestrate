import {
  defaultReducer,
  installRegistry,
  createAggregate,
  createService,
} from '@redux-orchestrate/core';
import providerFactory from './providerFactory';
import connectFactory from './connectFactory';
import renderFactory from './renderFactory';

const key = '__react_redux_orchestrate__';
const Provider = providerFactory(key);
const connect = connectFactory(key);
const render = renderFactory(key);

export {
  defaultReducer,
  installRegistry,
  createAggregate,
  createService,
  Provider,
  connect,
  render,
};
