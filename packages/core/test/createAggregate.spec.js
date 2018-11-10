import { createStore } from './fixtures/store';
import { createAggregate } from '../src';

describe('createAggregate', () => {
  it('returns a function that makes a container after initialized by the store', () => {
    const store = createStore();
    const counter = createAggregate('counter', 0, {
      increment: (step = 1) => count => count + step,
      decrement: (step = 1) => count => count - step,
    });
    const container = store.initialize(counter);
    const methods = Object.keys(container).sort();

    expect(methods).toEqual(['getEventCreators', 'getSideEffects', 'makeCommands', 'readModel']);
  });

  it('mounts the initial state to the store with its name as key', () => {
    const store = createStore();
    const counter = createAggregate('counter', 0, {
      increment: (step = 1) => count => count + step,
      decrement: (step = 1) => count => count - step,
    });
    const list = createAggregate('list', [], {
      add: item => list => list.concat(item),
      remove: item => list.filter(content => content !== item),
    });

    expect(store.getState()).toEqual({});
    store.initialize(counter);
    expect(store.getState()).toEqual({ counter: 0 });
    store.initialize(list);
    expect(store.getState()).toEqual({ counter: 0, list: [] });
  });

  it('exposes its underlying event creators that update the store state', () => {
    const store = createStore();
    const counter = createAggregate('counter', 0, {
      increment: (step = 1) => count => count + step,
      decrement: (step = 1) => count => count - step,
    });

    const container = store.initialize(counter);
    const eventCreators = container.getEventCreators();

    let state = store.getState();

    expect(container.readModel(state)).toEqual(0);
    state = eventCreators.increment()(state);
    expect(container.readModel(state)).toEqual(1);
    state = eventCreators.increment(9)(state);
    expect(container.readModel(state)).toEqual(10);
    state = eventCreators.decrement()(state);
    state = eventCreators.decrement()(state);
    expect(container.readModel(state)).toEqual(8);
  });

  it('provides an interface for reading model and making commands that select and update the state', () => {
    const store = createStore();
    const counter = createAggregate('counter', 0, {
      increment: (step = 1) => count => count + step,
      decrement: (step = 1) => count => count - step,
    });

    const container = store.initialize(counter);
    const commands = container.makeCommands(store.dispatch);

    expect(container.readModel(store.getState())).toEqual(0);
    commands.increment();
    expect(container.readModel(store.getState())).toEqual(1);
    commands.increment(9);
    expect(container.readModel(store.getState())).toEqual(10);
    commands.decrement();
    commands.decrement();
    expect(container.readModel(store.getState())).toEqual(8);
  });

  it('does not reset the state if it is re-initialized', () => {
    const store = createStore();
    const counter = createAggregate('counter', 0, {
      increment: (step = 1) => count => count + step,
      decrement: (step = 1) => count => count - step,
    });
    const container = store.initialize(counter);
    const commands = container.makeCommands(store.dispatch);

    expect(store.getState()).toEqual({ counter: 0 });
    commands.increment();
    expect(store.getState()).toEqual({ counter: 1 });
    store.initialize(counter);
    expect(store.getState()).toEqual({ counter: 1 });
  });
});
