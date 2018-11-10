import { createStore } from './fixtures/store';
import { createCounterAggregate } from './fixtures/createAggregate';
import { createService } from '../src';

describe('createService', () => {
  it('returns a function that makes a container after initialized by the store', () => {
    const store = createStore();
    const counter = createCounterAggregate();
    const service = createService('test', counter, count => count);
    const container = store.initialize(service);
    const methods = Object.keys(container).sort();

    expect(methods).toEqual(['getEventCreators', 'getSideEffects', 'makeCommands', 'readModel']);
  });

  it('mounts the initial state of all dependent aggregates to the store using their name as key', () => {
    const store = createStore();
    const counterA = createCounterAggregate('counterA', 10);
    const counterB = createCounterAggregate('counterB', -10);
    const serviceA = createService('counterA', counterA, count => -1 * count);
    const serviceB = createService(
      'test',
      [serviceA, counterB],
      (countA, countB) => countA + countB,
    );

    expect(store.getState()).toEqual({});
    store.initialize(serviceB);
    expect(store.getState()).toEqual({ counterA: 10, counterB: -10 });
  });

  it('injects state of its dependencies to the modelFactory', () => {
    const modelFactoryA = jest.fn().mockImplementation(count => -1 * count);
    const modelFactoryB = jest.fn().mockImplementation((countA, countB) => countA + countB);
    const store = createStore();
    const counterA = createCounterAggregate('counterA', 10);
    const counterB = createCounterAggregate('counterB', -10);
    const serviceA = createService('counterA', counterA, modelFactoryA);
    const serviceB = createService('test', [serviceA, counterB], modelFactoryB);
    const container = store.initialize(serviceB);

    expect(modelFactoryA).not.toBeCalled();
    expect(modelFactoryB).not.toBeCalled();
    expect(container.readModel(store.getState())).toEqual(-20);
    expect(modelFactoryA).toBeCalledWith(10);
    expect(modelFactoryB).toBeCalledWith(-10, -10);
  });

  it('makes new model based on the result of the modelFactory', () => {
    const store = createStore();
    const counterA = createCounterAggregate('counterA', 10);
    const counterB = createCounterAggregate('counterB', -10);
    const service = createService('test', [counterA, counterB], (a, b) => ({
      a,
      b,
      total: a + b,
      diff: a > b ? a - b : b - a,
    }));
    const container = store.initialize(service);
    const model = container.readModel(store.getState());

    expect(model).toEqual({
      a: 10,
      b: -10,
      total: 0,
      diff: 20,
    });
  });

  it('injects event creators of its dependencies to the eventCreatorFactory', () => {
    const eventCreatorFactoryA = jest.fn().mockImplementation(a => ({
      add2: () => a.increment(2),
      minus3: () => a.decrement(3),
    }));
    const eventCreatorFactoryB = jest.fn().mockReturnValue({});
    const store = createStore();
    const counterA = createCounterAggregate('counterA', 10);
    const counterB = createCounterAggregate('counterB', -10);
    const serviceA = createService('counterA', counterA, count => -1 * count, eventCreatorFactoryA);
    const serviceB = createService(
      'test',
      [serviceA, counterB],
      (a, b) => a + b,
      eventCreatorFactoryB,
    );

    expect(eventCreatorFactoryA).not.toBeCalled();
    expect(eventCreatorFactoryB).not.toBeCalled();

    store.initialize(serviceB);
    expect(eventCreatorFactoryA).toBeCalled();
    expect(eventCreatorFactoryA.mock.calls[0]).toHaveLength(1);
    expect(Object.keys(eventCreatorFactoryA.mock.calls[0][0]).sort()).toEqual([
      'decrement',
      'increment',
    ]);
    expect(eventCreatorFactoryB).toBeCalled();
    expect(eventCreatorFactoryB.mock.calls[0]).toHaveLength(2);
    expect(Object.keys(eventCreatorFactoryB.mock.calls[0][0]).sort()).toEqual(['add2', 'minus3']);
    expect(Object.keys(eventCreatorFactoryB.mock.calls[0][1]).sort()).toEqual([
      'decrement',
      'increment',
    ]);
  });

  it('makes new event creators based on the result of the eventCreatorFactory', () => {
    const store = createStore();
    const counterA = createCounterAggregate('counterA', 10);
    const counterB = createCounterAggregate('counterB', -10);
    const modelFactory = (countA, countB) => countA + countB;
    const service = createService('test', [counterA, counterB], modelFactory, (a, b) => ({
      addA: a.increment,
      add2toB: () => b.increment(2),
    }));
    const container = store.initialize(service);
    const eventCreators = container.getEventCreators();

    expect(Object.keys(eventCreators).sort()).toEqual(['add2toB', 'addA']);

    let state = store.getState();

    expect(state).toEqual({ counterA: 10, counterB: -10 });
    state = eventCreators.addA()(state);
    expect(state).toEqual({ counterA: 11, counterB: -10 });
    state = eventCreators.addA(3)(state);
    expect(state).toEqual({ counterA: 14, counterB: -10 });
    state = eventCreators.add2toB()(state);
    expect(state).toEqual({ counterA: 14, counterB: -8 });
    state = eventCreators.add2toB(8)(state);
    expect(state).toEqual({ counterA: 14, counterB: -6 });
  });

  it('injects an extra createEvent helper if the eventCreatorFactory returns a function', () => {
    const store = createStore();
    const counterA = createCounterAggregate('counterA', 10);
    const counterB = createCounterAggregate('counterB', -10);
    const modelFactory = (countA, countB) => ({ countA, countB });
    const service = createService(
      'test',
      [counterA, counterB],
      modelFactory,
      (a, b) => createEvent => ({
        doubleA() {
          const event = createEvent(({ countA }) => {
            return countA > 0 ? a.increment(countA) : a.decrement(countA);
          });

          return event;
        },
        doNothing() {
          return createEvent();
        },
        reset() {
          const event = createEvent(({ countA, countB }) => [
            a.increment(-countA),
            b.increment(-countB),
          ]);

          return event;
        },
      }),
    );
    const container = store.initialize(service);
    const eventCreators = container.getEventCreators();

    let state = store.getState();

    expect(state).toEqual({ counterA: 10, counterB: -10 });
    state = eventCreators.doubleA()(state);
    expect(state).toEqual({ counterA: 20, counterB: -10 });
    state = eventCreators.doubleA()(state);
    expect(state).toEqual({ counterA: 40, counterB: -10 });
    state = eventCreators.doNothing()(state);
    expect(state).toEqual({ counterA: 40, counterB: -10 });
    state = eventCreators.reset()(state);
    expect(state).toEqual({ counterA: 0, counterB: 0 });
    state = eventCreators.doubleA()(state);
    expect(state).toEqual({ counterA: 0, counterB: 0 });
  });

  it('inherits the event creators if there is only one dependency', () => {
    const store = createStore();
    const counterA = createCounterAggregate('counterA', 10);
    const counterB = createCounterAggregate('counterB', -10);
    const serviceA = createService('counterA', counterA, count => -1 * count);
    const serviceB = createService(
      'test',
      [serviceA, counterB],
      (countA, countB) => countA + countB,
    );
    const containerA = store.initialize(serviceA);
    const containerB = store.initialize(serviceB);
    const eventCreatorsA = containerA.getEventCreators();
    const eventCreatorsB = containerB.getEventCreators();

    expect(Object.keys(eventCreatorsA).sort()).toEqual(['decrement', 'increment']);
    expect(eventCreatorsB).toEqual({});

    let state = store.getState();

    expect(state).toEqual({ counterA: 10, counterB: -10 });
    state = eventCreatorsA.increment(2)(state);
    expect(state).toEqual({ counterA: 12, counterB: -10 });
    state = eventCreatorsA.decrement(8)(state);
    expect(state).toEqual({ counterA: 4, counterB: -10 });
  });

  it('injects side effects of its dependencies to the sideEffectFactory', () => {
    const sideEffectFactoryA = jest.fn().mockReturnValue({
      test() {
        return 'test';
      },
    });
    const sideEffectFactoryB = jest.fn().mockReturnValue({});
    const store = createStore();
    const counterA = createCounterAggregate('counterA', 10);
    const counterB = createCounterAggregate('counterB', -10);
    const serviceA = createService(
      'counterA',
      counterA,
      count => count,
      eventCreator => eventCreator,
      sideEffectFactoryA,
    );
    const serviceB = createService(
      'test',
      [serviceA, counterB],
      (countA, countB) => countA + countB,
      (a, b) => ({}),
      sideEffectFactoryB,
    );

    expect(sideEffectFactoryA).not.toBeCalled();
    expect(sideEffectFactoryB).not.toBeCalled();

    store.initialize(serviceB);
    expect(sideEffectFactoryA).toBeCalled();
    expect(sideEffectFactoryA).toBeCalledWith({});
    expect(sideEffectFactoryB).toBeCalled();
    expect(sideEffectFactoryB.mock.calls[0]).toHaveLength(2);
    expect(Object.keys(sideEffectFactoryB.mock.calls[0][0]).sort()).toEqual(['test']);
    expect(sideEffectFactoryB.mock.calls[0][1]).toEqual({});
  });

  it('injects a selector and action creators if the sideEffectFactory returns a function', () => {
    const store = createStore();
    const counter = createCounterAggregate('counter');
    const service = createService(
      'test',
      counter,
      count => (count > 0 ? 'Positive' : count < 0 ? 'Negative' : 'Zero'),
      eventCreator => ({
        plus: eventCreator.increment,
        minus: eventCreator.decrement,
      }),
      sideEffect => (selector, actionCreators) => {
        expect(`${actionCreators.plus}`).toEqual('service/test/plus');
        expect(`${actionCreators.minus}`).toEqual('service/test/minus');
        expect(selector(store.getState())).toEqual('Zero');
        store.dispatch(actionCreators.plus(3));
        expect(selector(store.getState())).toEqual('Positive');
        store.dispatch(actionCreators.minus(5));
        expect(selector(store.getState())).toEqual('Negative');
        store.dispatch(actionCreators.plus());
        expect(selector(store.getState())).toEqual('Negative');

        return {};
      },
    );

    store.initialize(service);
  });

  it('inherits the side effects if there is only one dependency', () => {
    const store = createStore();
    const counterA = createCounterAggregate('counterA', 10);
    const counterB = createCounterAggregate('counterB', -10);
    const serviceA = createService(
      'counterA',
      counterA,
      count => count,
      eventCreator => eventCreator,
      sideEffect => ({
        test() {
          return 'test';
        },
      }),
    );
    const serviceB = createService('test', serviceA, a => a);
    const serviceC = createService(
      'test',
      [serviceA, counterB],
      (countA, countB) => countA + countB,
    );
    const containerA = store.initialize(serviceA);
    const containerB = store.initialize(serviceB);
    const containerC = store.initialize(serviceC);
    const sideEffectsA = containerA.getSideEffects();
    const sideEffectsB = containerB.getSideEffects();
    const sideEffectsC = containerC.getSideEffects();

    expect(Object.keys(sideEffectsA).sort()).toEqual(['test']);
    expect(Object.keys(sideEffectsB).sort()).toEqual(['test']);
    expect(Object.keys(sideEffectsC).sort()).toEqual([]);
  });

  it('injects the selector, actionCreators, sideEffects together with the utilities to the onInitialize hook', () => {
    const onInitialize = jest.fn();
    const store = createStore('test');
    const counter = createCounterAggregate('counter');
    const service = createService(
      'test',
      counter,
      count => (count > 0 ? 'Positive' : count < 0 ? 'Negative' : 'Zero'),
      eventCreator => ({
        plus: eventCreator.increment,
        minus: eventCreator.decrement,
      }),
      sideEffect => ({ test: () => 'test sideEffect' }),
      onInitialize,
    );

    expect(onInitialize).not.toBeCalled();
    store.initialize(service);
    expect(onInitialize).toBeCalledTimes(1);

    const [selector, actionCreators, sideEffects, utilities] = onInitialize.mock.calls[0];

    expect(selector(store.getState())).toEqual('Zero');
    store.dispatch(actionCreators.plus(3));
    expect(selector(store.getState())).toEqual('Positive');
    store.dispatch(actionCreators.minus(5));
    expect(selector(store.getState())).toEqual('Negative');
    expect(sideEffects.test()).toEqual('test sideEffect');
    expect(utilities).toEqual('test');
  });

  it('overrides the default action creators if the onInitialize hook returns something', () => {
    const test = jest.fn().mockReturnValue({ type: 'TESTING_ONLY' });
    const store = createStore();
    const counter = createCounterAggregate('counter');
    const service = createService(
      'test',
      counter,
      count => (count > 0 ? 'Positive' : count < 0 ? 'Negative' : 'Zero'),
      eventCreator => ({
        plus: eventCreator.increment,
        minus: eventCreator.decrement,
      }),
      sideEffect => ({ test }),
      (selector, actionCreators, sideEffects) => sideEffects,
    );
    const container = store.initialize(service);
    const commands = container.makeCommands(store.dispatch);

    expect(Object.keys(commands).sort()).toEqual(['test']);
    expect(test).not.toBeCalled();
    commands.test('abc');
    expect(test).toBeCalledWith('abc');
  });
});
