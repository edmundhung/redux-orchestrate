import { createStore as baseCreateStore } from 'redux';
import { defaultReducer, installRegistry } from '../../src';

function createStore(utilities) {
  return baseCreateStore(defaultReducer, installRegistry(utilities));
}

export { createStore };
