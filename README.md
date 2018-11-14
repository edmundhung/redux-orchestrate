# redux-orchestrate

![CircleCI (all branches)](https://img.shields.io/circleci/project/github/EdStudio/redux-orchestrate.svg?style=flat-square)
![npm (scoped)](https://img.shields.io/npm/v/@redux-orchestrate/core.svg?style=flat-square)
![Codecov badge](https://img.shields.io/codecov/c/github/EdStudio/redux-orchestrate/master.svg)
![NpmLicense](https://img.shields.io/npm/l/@redux-orchestrate/core.svg?style=flat-square)

An opinionated framework inspired by domain-driven design and the event sourcing pattern. It ships a `core` store enhancer together with a custom `react-redux` binding. It is...

- **Composable**: Reuses and combines your business logic with ease
- **Loadable**: Enables code splitting with a built-in registry
- **Extensible**: Supports most of the plugins from the redux community and any view libraries
- **Compatible**: Allows [gradual migration](#migration) for project building with the official `react-redux` package
- **Efficient**: Do not recompute until state change
- **Lightweight**: The `core` and the `react-redux` binding are only **1.5**KB and **1.2**KB (minified & gzipped)

## Installation

To use `redux-orcestrate` with React, you will need the following packages.

```
npm install --save redux react react-redux
```

If you have all the peer dependencies installed, you can then install our `react-redux` binding. Installing the core explicity is not required as it is an internal dependency of the binding.

```
npm install --save @redux-orchestrate/react-redux
```

## Getting Started

In this section, we will go through the APIs one by one with a counter example. Even though `redux-orchestrate` provides an alternative approach in building application, basic knowledges of `redux` is required. Also, as this framework borrows terminology from several areas, we strongly recommend reading the [Glossary](#glossary) section before going through this tutotial.

To start, let's set up the store first.

```js
// File: store.js

import { createStore } from 'redux';
import { defaultReducer, installRegistry } from '@redux-orchestrate/react-redux';

/**
 *  The `installRegistry` API returns a storeEnhancer
 *  This is the only setup needed for enabling redux-orchestate
 */
const enhancer = installRegistry();

/**
 *  Here we pass the default reducer from the package
 *  This is recommendeded if you want redux-orchestrate managing all state for you
 *  But it also supports any custom reducer
 *  For details, please refer to the Migration section
 */
export default createStore(defaultReducer, enhancer);
```

After setting up the store, we can now create our first counter [aggregate](#aggregate). It takes `0` as the initial state and provides 2 [event creators](#event-creator), `increment` and `decrement`.

```js
// File: counter.js

import { createAggregate } from '@redux-orchestrate/react-redux';

/**
 *  `increment` is an example of event creator
 *  It always return an event when being called
 *  An event is a function with `state => state` signature
 *  All events must be immutable
 */
function increment() {
  return count => count + 1;
}

function decrement() {
  return count => count - 1;
}

export default createAggregate(
  'counter',                // The name of your aggregate
  0,                        // Initial state
  { increment, decrement }, // Event Creators
);
```

Finally, we can start building the UI. We will use the [render](#render) API provided by our `@redux-orchestrate/react-redux` binding for converting the [aggregate](#aggregate) to a React component. The React component created follows the [render props](https://reactjs.org/docs/render-props.html) pattern.

```js
// File: app.js

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider, render } from '@redux-orchestrate/react-redux';

// Import the two files prepared above
import store from './store';
import counter from './counter';

/**
 *  This is a seletor function that will be passed to render later
 *  It allows selecting a subset of state and commands to be provided in the render props
 *  It will also receives the component props from the 3rd argument of the selector
 *  The command received has the same shape as the event creators of the counter aggregate
 *  They are action creators wrapped with dispatch after a register process internally
 */
function selector(state, command, /* props */) {
  return {
    value: state,
    increase: command.increment,
    decrease: command.decrement,
  };
}

// Creating a Counter component using the counter aggregate
const Counter = render(counter, selector);

/**
 *  We provide the store here through our Provider component
 *  It works like the official `react-redux` <Provider />
 */
const counterApp = (
  <Provider store={store}>
    <Counter>
      {({ value, increase, decrease }) => (
        <div>
          Clicked: {value} times
          {' '}
          <button onClick={increase}>
            +
          </button>
          {' '}
          <button onClick={decrease}>
            -
          </button>
        </div>
      )}
    </Counter>
  </Provider>
);

ReactDOM.render(
  counterApp,
  document.getElementById('root'),
);
```

Here we have completed the counter app without writing any action creators or reducers. Note that the store does not maintain the state of the counter aggregate and is not aware of any counter events until we render the `<Counter />` component. This makes `code splitting` as simple as dynamically importing components.

You may still wonder why this worths reinventing the wheel. Let's go further by  composing the [aggregates](#aggregate) using [services](#service):

Now, imagine that a client wants to use the counter app for counting visitors in two rooms during an exhibiton. Since each room need an independent counter, we can rewrite the counter aggregate using an `aggregateFactory` pattern.

```js
// File: room.js

import { createAggregate } from '@redux-orchestrate/react-redux';

/**
 *  Aggregate Factory is a function that returns a new aggregate
 *  Since the name of the aggregate must be unqiue
 *  It should accepts at least one argument as the name of the result aggregate
 */
function createRoomCounterAggregate(name) {
  function enter() {
    return count => count + 1;
  }

  function leave() {
    return count => count - 1;
  }

  return createAggregate(name, 0, { enter, leave });
}

export const roomA = createRoomCounterAggregate('roomA');
export const roomB = createRoomCounterAggregate('roomB');
```

However, there are many more visitors than they expected. The client would like to setup a crowd control policy by enforcing the following rules:

1. Visitors can only enter room B from room A through the door in between.
2. The route is one-way, from room A entrance to room B exit.
3. Maximum allowed visitor count is room A is 25 and room B is 15.

To orchestrate the two counters obeying the above logics, it's time to try creating a [service](#service).

```js
// File: roomCounter.js

import { createService } from '@redux-orchestrate/react-redux';
import { roomA, roomB } from './room';

/**
 *  Every service has its own model
 *  By passing it to `createService`, it receives state of its dependencies injected by the framework
 *  The state injected follows the order of its dependencies
 *  In this example, it receive the count of room a and then room b
 *  The result model could be anything based on your context
 */
function modelFactory(countA, countB) {
  return {
    countA: countA,
    countB: countB,
    isRoomAFull: countA === 25,
    isRoomBFull: countB === 15,
  };
}

/**
 *  Every service has its own event creators too
 *  The factory receives event creators of its dependencies injected by the framework
 *  The order follows its dependencies just like modelFactory
 *  By returning a function, the framework injects a `createEvent` helper
 *  This helper allows developers making a new event by consulting the current model
 */
function eventCreatorFactory(roomA, roomB) {
  return (createEvent) => ({

    /**
     *  Visitors can only enter from room A
     *  They are not allowed to enter if it is full
     */
    enter() {
      const handler = model => {

        // No events will be emitted by returning nothing or an empty array
        if (model.isRoomAFull) {
          return;
        }

        return roomA.enter();
      };

      return createEvent(handler);
    },

    // Visitors can pass through the door from room A when room B is not full
    crossDoor() {
      const handler = model => {

        if (model.isRoomBFull) {
          return;
        }

        // Here we return an array of events
        // As visitors passing through the door increases the count of room B
        // and also decreases the count of room A
        return [
          roomB.enter(),
          roomA.leave(),
        ];
      };

      return createEvent(handler);
    }

    /**
     *  Visitors can leave room B anytime
     */
    leave() {
      // As we don't need to make a decision using the model
      // We can return an event directly
      return roomB.leave();
    },

  });
}

export default createService(
  'roomCounter',       // Name of the service
  [ roomA, roomB ],    // Dependencies, could be both aggregates and services
  modelFactory,        // Setting up a model of the service
  eventCreatorFactory, // Setting up event creators of the service
);
```

The [createService](#createService) API not only allows setting up new model and event creators, but also making side effects with hooks. For details, please refer to our [async examples](#examples).
You can also consume the model and commands of services into React using the [render](#render) and [connect](#connect) API. Unlike `render`,  the `connect` API creates a [Higher-Order component](https://reactjs.org/docs/higher-order-components.html).

```js
// File: roomApp.js

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider, connect } from '@redux-orchestrate/react-redux';

// Import the same store prepared in the Getting Started section
import store from './store';
// The `roomCounter` service just create above
import roomCounter from './roomCounter';

function Counter(props) {
  return (
    <div>
      <div>Room A: {props.countA} visitors</div>
      <div>Room B: {props.countB} visitors</div>
      <div>
        <button onClick={props.enter}>
          Enter
        </button>
        {' '}
        <button onClick={props.crossDoor}>
          Cross Door
        </button>
        {' '}
        <button onClick={props.leave}>
          Leave
        </button>
      </div>
    </div>
  );
}

/**
 *  This is a seletor function that will be passed to connect later
 *  It serves the same purpose as the selector passed to the `render` API previously
 *  It allows selecting a subset of state and commands to be injected to the component
 *  It will also receives the component props from the 3rd argument of the selector
 */
function selector(model, command /* , props */) {
  return {
    countA: model.countA,
    countB: model.countB,
    enter: command.enter,
    crossDoor: command.crossDoor,
    leave: command.leave,
  };
}

// Creating an App component using the roomCounter service and the Counter component
const App = connect(roomCounter, selector)(Counter);

const roomApp = (
  <Provider store={store}>
    <App />
  </Provider>
);

ReactDOM.render(
  roomApp,
  document.getElementById('root'),
);
```

Here we go through all the APIs shipped in `@redux-orchestrate/react-redux`. Some of them are re-exports of the `core` package. If you would like try it out yourself, please take a look of the provided [example sandbox](#examples) and also the [migration strategy](#migration).

## Examples

### [**todos**](https://codesandbox.io/s/github/EdStudio/redux-orchestrate/tree/master/examples/todos)
A classic todos example showing how your business logic could be quickly orchestrated with [createAggregate()](#createAggregate) & [createService()](#createService).
By enabling [redux-devtools-extension](https://github.com/zalmoxisus/redux-devtools-extension), you can montior the actions being dispatched automatically which make states changes on `Redux`.
You may reference the [native approach](https://redux.js.org/introduction/examples#todos) provided by the `Redux` official repository.

### [**async-thunk**](https://codesandbox.io/s/github/EdStudio/redux-orchestrate/tree/master/examples/async-thunk)
An example demonstrating how you could orchestrate thunks with services.
It includes creating thunks with the provided selector and actionCreators which will finally be reused by another service.
You may reference the [native approach](https://redux.js.org/introduction/examples#async) provided by the `Redux` official repository.

### [**async-saga**](https://codesandbox.io/s/github/EdStudio/redux-orchestrate/tree/master/examples/async-saga)
An example demonstrating how you could orchestrate sagas with services.
It includes creating saga in the sideEffectFactory which will then be reused and dynamically added to the `redux-saga` middleware by another service.
You may reference the [native approach](https://github.com/redux-saga/redux-saga/tree/master/examples/async) provided by the `redux-saga` official repository.

### [**independent-counter**](https://codesandbox.io/s/github/EdStudio/redux-orchestrate/tree/master/examples/independent-counter)
An example showcasing the compatible mode of `redux-orchestrate`.
It allows rgw developer to start building new features using aggregate and services without breaking existing action creators and reducers.
There are [certain limitations](#limitation) in this mode.

## Migration
`redux-orchestrate` is completely __opt-in__.
You can try it without modifying any of the existing action creators, reducers or selectors.
For projects using `react-redux`, all connected components are also supported.
The [setup](#setup) process requires changes to only a few lines of code.

### Setup
Enabling `redux-orchestrate` is as simple as adding a store enhancer to your redux store.

```js
import { createStore, applyMiddleware, compose } from 'redux';
import { installRegistry } from '@redux-orchestrate/react-redux';
import logger from 'redux-logger';
import thunk from 'redux-thunk';
import reducer from './your-custom-reducer';

/**
 *  The `installRegistry()` API returns a storeEnhancer
 */
const applyRegistry = installRegistry();

/**
 * Assume you were setting up your project with two middlewares: redux-logger & redux-thunk
 * To apply both the registry and your middlewares, you will need the `compose` API shipped with redux
 * Note that the registry must be applied before the middlewares if you are using a custom reducer
 * It ensures middlewares receiving a correct state tree
 */
const enhancer = compose(
  applyMiddleware(logger, thunk),
  applyRegistry, // This will be applied before middleware
);

/**
 *  Just make sure you provide the composed enhancer instead
 */
const store = createStore(reducer, enhancer);
```

If your project is using the official `react-redux` binding, then you will need to do one more change:
Replace the original `react-redux` Provider component with the `@redux-orchestrate/react-redux` Provider component.

```diff
-import { Provider } from 'react-redux';
+import { Provider } from '@redux-orchestrate/react-redux';
```

### Limitations

#### 1. The top level state shape must not be a Primitive, i.e. boolean, number, string
`redux-orchestrate` makes sure your original state and the orchestrated state are being isolated by lifting up the state tree.
But this affects the state shape returned from `store.getState()`.
To avoid requiring users to update their existing selectors, it restructures the state tree returned.
It brings the original state tree back to the top level and dynamically mounts the orchestrated state as a subtree.
This works great if the original state shape is purely an object literals, especially if the users are using the `combineReducers()` helper.
Unfortunately, if the root reducer returns any primitive such as numbers, we will encounter a problem since some of the view libraries like React only render state that is pure primitive.
They may complain when receiving the restructured state which is modified and now object-like.

#### 2. Project with multiple stores setup are not supported
In fact, this is possible. But we would like to limit the API surface and collect more feedback before introducing it.
Please issue a feature request with explanation of your use case.



## Roadmap

### 1. Shipping `@redux-orchestrate/react` with the best performance ever

`@redux-orchestrate/react-redux` is a wrapper on top of the official `react-redux` binding.
This helps us promote the framework by providing a compatible API with robust stability.
With this package, all connected components will try to re-render every time the store state is updated.
Its performance mainly relies on the memorization of the selectors.
Since the core API allows us to track state access by aggregates and services,
it is now possible to minimize re-render by preventing non-relevant views from being notified at all.
We believe this will probably take the performance to the next level.

### 2. Delivering some common aggregateFactory

As shown in the Getting Started section,
`aggregateFactory` is extremely useful for quickly bootstrapping repetitive scenarios.
Due to the fact that aggregates should be as dumb as possible,
we can deliver some of the most common aggregateFactory with proper options setting up.
E.g. Form / Data repository

### 3. More bindings

Even though `redux-orchestrate` is currently shipped with an offical React bindings only, its core is applicable to any view libraries. But this requires supports from the communties and we would love to hear suggestions and feedback from devs with experiences on different view libraries like Angular and vue.

## API Reference

### core

- [installRegistry](#installRegistry)
- [createAggregate](#createAggregate)
- [createService](#createService)

#### installRegistry

```js
installRegistry(utilities?: Object): Function
```

Creates a [store enhancer](https://redux.js.org/glossary#store-enhancer).
It applies a registry to the Redux store and helps initilaizing aggregates and services.

##### Arguments

1. `utilities?: Object`:
Optional.
Provided utitlies will be injected into the `onInitialize` hook of `services` which will be useful for dynamic plugin setup.

##### Usage

```js
import { createStore, applyMiddleware, compose } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { installRegistry } from '@redux-orchestrate/react-redux';

/**
 *  Let's say you are using redux-saga
 */
const sagaMiddleware = createSagaMiddleware();
const applyRegistry = installRegistry({

  /**
   *  We provide a `runSaga` utility function
   *  So that new saga can be added dynamcially from the service
   */
  runSaga(saga) {
    return sagaMiddleware.run(saga);
  },

});

const enhancer = compose(
  applyMiddleware(sagaMiddleware),
  applyRegisty,
);

const store = createStore(reducer, enhancer);
```

#### createAggregate

```js
createAggregate(name: string, initialState: Object, eventCreators: Object): Function
```

In event-sourcing, an aggregate represents a certain domain of your application.
It populates state by consuming events.
Aggreates can be treated as a reducer that has been split into several parts.
Its state will be mounted on the state tree with its name as the key.

##### Arguments

1. `name: string`:
Must be **unique** among all aggregates.
It is the key mounted to the state tree and also the namespace of its action types.
2. `initialState: object`:
The initial state of the subtree
3. `eventCreators: object`:
A map of eventCreators with key being its name.

##### Usage

```js
import { createAggregate } from '@redux-orchestrate/react-redux';

const initialState = {
  todoById: {},
  completedTodoIds: [],
};

const eventCreators = {

  add(id, text) {
    const event = state => ({
      ...state,
      todoById: {
        ...state.todoById,
        [id]: text,
      },
    });

    return event;
  },

  toggle(todoId) {
    const event = state => {
      const completedTodoIds = state.completedTodoIds.indexOf(todoId) > -1
        ? state.completedTodoIds.filter(id => id !== todoId)
        : state.completedTodoIds.concat(todoId);

      return {
        ...state,
        completedTodoIds,
      };
    };

    return event;
  },

  remove(todoId) {
    const event = state => {
      if (typeof state.todoById[todoId] === 'undefined') {
        return state;
      }

      return {
        ...state,
        completedTodoIds: state.completedTodoIds.filter(id => id !== todoId),
        todoById: Object
          .keys(state.todoById)
          .filter(id => id !== todoId)
          .reduce((result, id) => {
            result[id] = state.todoById[id];
          }, {}),
      };
    };

    return event;
  }

};

export default createAggregate('todos', initialState, eventCreators);
```

#### createService

Services usually represent a certain context of your application.
It combines several aggregates or even services to form a new one.
It allows user to create new models, event creators and side effects.

```js
createService(name: string, dependencies: Function | Array<Function>, modelFactory: Function, eventCreatorFactory?: Function, sideEffectFactory?: Function, onInitialize?: Function): Function
```

##### Arguments

1. `name: string`:
Must be **unique** among all services.
It is the namespace of its action types.
2. `dependencies: Function | Array<Function>`:
Dependent aggregates and services.
3. `modelFactory: Function`:
Factory for making the model.
4. `eventCreatorFactory?: Function`:
Optional. Factory for making the event creators.
5. `sideEffectFactory?: Function`:
Optional. Factory for making the side effects.
6. `onInitialize?: Function`:
Optional. Initialize hook of the service.

##### Usage

```js
import { createService } from '@redux-orchestrate/react-redux';

// Here we import the example from `createAggregate`
import todos from '../aggregates/todos';

/**
 *  The Model could be any type
 *  It receives the state of its dependencies as the arguments
 *  Usually we will return an object
 */
function modelFactory(state) {
  return {

    /**
     * It may include normal properties
     */
    completedCount: state.completedTodoIds.length,

    /**
     * It may also include getters
     */
    get todoIds() {
      return Object.keys(state.todoById);
    },

    get todos() {
      return this.todoIds.map(id => state.todoById[id]);
    },

    /**
     * Functions are also accepted
     */
    getTodo(id) {
      if (typeof state.todoById[id] === 'undefined') {
        return null;
      }

      return state.todoById[id];
    },

    isCompleted(id) {
      return state.completedTodoIds.indexOf(id) > -1;
    },

  };
}

/**
 * You can compose new event creators in this function based on the context
 * It receives the events of its dependencies as the arguments
 * If you return a function, it will provide you with a `createEvent` helper
 * This helper allows you to further compose the event creators
 * By consulting with the model and combining several events
 * When missing eventCreatorFactory, it handles differently based on the number of dependencies:
 * 1. If there is only one dependency, event creators will be inherited
 * 2. Otherwise no event creators will be set
 */
function eventCreatorFactory(event) {
  return createEvent => ({

    /**
     * E.g. we want to auto-gerneate a todo id by incrementing the last id
     * You can call `createEvent` by providing a callback
     * The callback receives the model so you can return event(s) based on it
     * It accepts returning either an array or an event
     */
    add(text) {
      const event = createEvent(model => {
        const lastId = Math.max.apply(null, [].concat(0, model.todoIds));

        return event.add(lastId + 1, text);
      });

      return event;
    },

    /**
     * E.g. we allow user to update the text of a todo
     * You can directly pass an array of events to createEvent as well
     */
    update(id, text) {
      const event = createEvent([
        event.remove(id),
        event.add(id, text),
      ]);

      return event;
    },

    /**
     * If there is no extra logic, you can also pass the event creators directly
     */
    toggle: event.toggle,

  });
}

/**
 *  After making the model and event creators, we can make some side effect handlers
 *  It receives the side effects of its dependencies as the arguments
 *  If the dependencies include aggregates, which has no side effect
 *  It will still receive an empty object
 *  In this example, the only dependency is the todos aggregate
 *  We will thus receive an empty object as the only argument
 *  So we can just skip it
 *  It provides you a selector and the action creators if you return a function
 *  When missing sideEffectFactory, it handles differently based on the number of dependencies:
 *  1. If there is only one dependency, side effects will be inherited
 *  2. Otherwise no side effects will be set
 */
function thunkFactory() {
  return (selector, actionCreators) => {

    /**
     *  E.g. You want to snapshots the todos created
     */
    add(text) {
      return (dispatch, getState) => {
        dispatch(actionCreators.add(text));

        const state = getState();
        const model = selecter(state);

        localStorage.setItem('todos', model.todos);
      };
    },

  };
}

/**
 * The onInitialize hook allows you to modify the service behaviour
 * It receives a selector which returns the model, action creators registered with the event creators,
 * the thunk created and also the utilities passed when calling `installRegistry()`
 * By returning a different set of action creators, it will be used to build the final commands.
 * If nothing is returned, the action creators converted will be used.
 */
function onInitialize(selector, actionCreator, thunk, utilities) {
  /**
   * Here we redefined the action creators
   * Since the thunk middleware enables thunk dispatch on the store
   */
  return {
    add: thunk.add,
    update: actionCreator.update,
    toggle: actionCreator.toggle,
  };
}

export default createService(
  'todos',
  todos,
  modelFactory,
  eventCreatorFactory,
  thunkFactory,
  onInitialize,
);
```

---------------------------------

### react-redux
- [Provider](#provider)
- [connect](#connect)
- [render](#render)


#### Provider

A wrapper on top of the official `react-redux` [Provider](https://react-redux.js.org/docs/api#provider) component. It does not provide any extra functionality except enabling the integration with aggregates and services.

##### Props

1. `store: ReduxStore`
2. `children: ReactElement`

##### Usage

```js
ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  container,
);
```

#### connect

```js
connect(aggregateOrService: Function, selector: Function)(ReactComponent): ReactComponent
```

Unlike `Provider`, our `connect` API does not have the same signature as the official `connect`. It is only meant to provide a [higher-order component](https://reactjs.org/docs/higher-order-components.html) by injecting the state and commands from the aggregates or services.

##### Usage

```js
import { connect } from '@redux-orchestrate/react-redux';

// Here we import the example from `createService`
import todos from './services/todos';

function App({ todoIds, add }) {
  return (
    <div>
      <TodoForm onSubmit={add} />
      <TodoList todoIds={todoIds} />
    </div>
  );
}

/**
 *  By providing a selector function,
 *  You can select what to be injected to the React component
 *  The selector could also receive `props` of the component as the third argument
 *  But for performance reason, you should not declare the props argument until you need it
 */
function selector(model, command) {
  return {
    todoIds: model.todoIds,
    add: command.add,
  };
}

export default connect(todos, selector)(App);
```

#### render

```js
render(service: Function, selector: Function): Component<Props>
```

`render` is similar to `connect` except not requiring a component. It follows the [render props](https://reactjs.org/docs/render-props.html) pattern.

##### Props
1. `component: Component<Props>`
2. `selector: Function`
3. `children: Function`

##### Usage

```js
import { connect } from '@redux-orchestrate/react-redux';

// Here we import the example from `createService`
import todos from './services/todos';

// Same as the selector of `connect`
function selector(model, command) {
  return {
    todoIds: model.todoIds,
    add: command.add,
  };
}

// Here we create a Todos component directly
const Todos = render(todos, selector);

// We use it by specifying a render props
function App() {
  return (
    <Todos>
      {({ todoIds, add }) => (
        <div>
          <TodoForm onSubmit={add} />
          <TodoList todoIds={todoIds} />
        </div>
      )}
    </Todos>
  );
}
```

## Glossary
This is a glossary of the terminology used in `redux-orchestrate`. The types are documented using [Flow notation](http://flowtype.org/docs/quick-reference.html).

### Event

```js
type Event<S> = (state: S) => S
```
Event is a function that accepts the current state and return the next state. It is the minimal level of state change. It describes a fact happened and how the state should be updated accordingly. Events are side-effects free. They must be pure functions. They are generally wrapped within event creator.


### Event Creator

```js
type EventCreator = (...args: any) => Event
```
Event creator is a function that creates event. It helps generalizing a certain type of event by accepting arguments to modify the event created. Event creators are also side-effects free. They must be pure functions.


### Command

```js
type Command = (...args: any) => Void
```

Command is function that call an action creator and immediately dispatch its result. It is equivalent to [bound action creators](https://github.com/reduxjs/redux/blob/master/docs/Glossary.md#action-creator) in Redux.


### Aggregate

Aggregate represents a certain domain of your application. It populates state by consuming events. It can be treated as a reducer that has been split into several parts. Its state will be mounted on the state tree with its name as the key.

### Service

Services usually represent a certain context of your application. It combines several aggregates or even services to form a new one. It allows user to create new models, event creators and side effects.


---------------------------------
[Back to top](#redux-orchestrate)
