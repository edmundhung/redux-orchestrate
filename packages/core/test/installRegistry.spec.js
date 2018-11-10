import { createStore, combineReducers } from 'redux';
import { createCounterAggregate } from './fixtures/createAggregate';
import { defaultReducer, installRegistry } from '../src';

describe('installRegistry', () => {
  it('returns a store enhancer', () => {
    const enhancer = installRegistry();
    const store = createStore(defaultReducer, enhancer);
    const methods = Object.keys(store).sort();

    expect(methods).toEqual([
      'dispatch',
      'getState',
      'initialize',
      'replaceReducer',
      'select',
      'subscribe',
    ]);
  });

  it('selects the orchestrated state tree even if using custom reducer', () => {
    const enhancer = installRegistry();
    let store;

    store = createStore(defaultReducer, enhancer);
    expect(store.select(store.getState())).toEqual({});
    store = createStore((state = {}) => state, enhancer);
    expect(store.select(store.getState())).toEqual({});
  });

  it('does not break any existing usage', () => {
    const createCounterReducer = initialCount => (count = initialCount, action) => {
      switch (action.type) {
        case 'INCREMENT':
          return count + 1;
        case 'DECREMENT':
          return count - 1;
        default:
          return count;
      }
    };
    const a = createCounterReducer(0);
    const b = createCounterReducer(9);
    const increment = { type: 'INCREMENT' };
    const decrement = { type: 'DECREMENT' };
    const aggregate = createCounterAggregate('test');
    const getCountA = state => state.a;
    const getCountB = state => state.b;
    const enhancer = installRegistry();

    let reducer = combineReducers({ a });
    let store = createStore(reducer, enhancer);

    expect(getCountA(store.getState())).toEqual(0);
    store.dispatch(increment);
    expect(getCountA(store.getState())).toEqual(1);
    store.replaceReducer(reducer);
    expect(getCountA(store.getState())).toEqual(1);
    store.replaceReducer(defaultReducer);
    expect(getCountA(store.getState())).toEqual(1);

    reducer = combineReducers({ a, b });
    store.replaceReducer(reducer);
    expect(getCountA(store.getState())).toEqual(1);
    expect(getCountB(store.getState())).toEqual(9);
    store.dispatch(increment);
    expect(getCountA(store.getState())).toEqual(2);
    expect(getCountB(store.getState())).toEqual(10);

    const container = store.initialize(aggregate);
    expect(getCountA(store.getState())).toEqual(2);
    expect(getCountB(store.getState())).toEqual(10);
    expect(container.readModel(store.select(store.getState()))).toEqual(0);

    store.dispatch(decrement);
    expect(getCountA(store.getState())).toEqual(1);
    expect(getCountB(store.getState())).toEqual(9);
    store = createStore(reducer, store.getState(), enhancer);
    expect(getCountA(store.getState())).toEqual(1);
    expect(getCountB(store.getState())).toEqual(9);

    store = createStore(defaultReducer, enhancer);
    store.replaceReducer(reducer);
    expect(store.getState()).toEqual({});
  });
});
