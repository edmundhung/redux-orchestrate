import { combineReducers, compose } from 'redux';
import memorize from './memorize';

/**
 * The key used for mounting the orchestrated state subtree on compatible mode
 *
 * @private
 */
const key = '__redux_orchestrate__';

/**
 * Helper - Initialzes store with an empty object.
 * Its main purpose is to notify the registry whether it should enable the compatible mode or not
 *
 * @param {*} state
 */
export function defaultReducer(state = {}) {
  return state;
}

/**
 * Helper - Resolves restuctured state tree if found
 *
 * @param {*} state
 */
export function resolveState(state) {
  if (!state || typeof state[key] === 'undefined') {
    return { original: state };
  }

  return compose(
    JSON.parse,
    JSON.stringify,
  )(state);
}

/**
 * Helper - Restucture state by lifting the original state to top
 *
 * @param {*} state
 */
export function restructureState(state) {
  return Object.assign({}, state.original, {
    [key]: state.orchestrated,
    toJSON: () => state,
  });
}

/**
 * Helper - Makes new action creator for the received action type
 *
 * @param {*} type
 */
export function makeActionCreator(type) {
  const actionCreator = (...payload) => ({ type, payload });

  return Object.assign(actionCreator, {
    /**
     *
     */
    toString() {
      return type;
    },
  });
}

/**
 * Helper - Makes reducer based on the provided initialize function and the registered event creators
 *
 * @param {*} initialize
 * @param {*} eventCreatorByType
 * @param {*} preloadedState
 */
export function makeReducer(initialize, eventCreatorByType, preloadedState) {
  return (state = preloadedState, action) => {
    const eventCreator = eventCreatorByType[action.type];

    if (typeof eventCreator === 'undefined') {
      return initialize(state, action);
    }

    return eventCreator.apply(null, action.payload).call(null, state);
  };
}

/**
 * Helper - Enable migration of store state when redux-orchestrate life up the state tree
 *
 * @param {*} key
 * @param {*} storeState
 * @param {*} reducer
 */
export function mirgrateLiftedState(key, storeState, reducer) {
  return (state, action) => {
    if (state === storeState) {
      return reducer({ [key]: storeState }, action);
    }

    return reducer(state, action);
  };
}

/**
 * Helper - Liftup event creator from local scope to global scope
 *
 * @param {*} key
 */
export function liftUp(key) {
  return reducer => state => {
    const prevState = state[key];
    const nextState = reducer(prevState);

    if (nextState === prevState) {
      return state;
    }

    return {
      ...state,
      [key]: nextState,
    };
  };
}

/**
 * Helper - Map over all keys by applying the provided function
 *
 * @param {*} obj
 * @param {*} fn
 */
export function mapKeys(obj, fn) {
  return Object.keys(obj).reduce(
    (result, key) =>
      Object.assign(result, {
        [fn(key, obj[key])]: obj[key],
      }),
    {},
  );
}

/**
 * Helper - Map over all values by applying the provided function
 *
 * @param {*} obj
 * @param {*} fn
 */
export function mapValues(obj, fn) {
  return Object.keys(obj).reduce(
    (result, key) =>
      Object.assign(result, {
        [key]: fn(obj[key], key),
      }),
    {},
  );
}

/**
 * Creates a registry which manages reducers and action creators of the store
 *
 * @param {*} reducer
 * @param {*} emitChange
 */
export function createRegistry(store, reducer, preloadedState) {
  let initializeByName = {};
  let eventCreatorByType = {};
  let actionCreatorByService = {};

  let baseReducer = reducer;
  let memorizedRestructureState = memorize(restructureState);
  let isLiftedUp = false;

  /**
   *
   */
  function replaceReducer() {
    let reducer = baseReducer;

    if (Object.keys(initializeByName).length > 0) {
      reducer = makeReducer(combineReducers(initializeByName), eventCreatorByType, preloadedState);
    }

    if (baseReducer !== defaultReducer) {
      reducer = combineReducers({
        original: baseReducer,
        orchestrated: reducer,
      });

      if (!isLiftedUp) {
        isLiftedUp = true;
        reducer = mirgrateLiftedState('original', store.getState(), reducer);
      }
    }

    store.replaceReducer(reducer);
  }

  return {
    initialize(name, initialState, eventCreatorByName) {
      const initialize = (state = initialState) => state;
      const readModel = compose(
        initialize,
        state => state[name],
      );
      const eventCreators = mapValues(eventCreatorByName, eventCreator =>
        compose(
          liftUp(name),
          eventCreator,
        ),
      );

      initializeByName[name] = initialize;

      return {
        readModel,
        eventCreators,
      };
    },

    replaceReducer(reducer) {
      if (baseReducer === defaultReducer) {
        return;
      }

      if (reducer === defaultReducer || reducer === baseReducer) {
        return;
      }

      baseReducer = reducer;

      replaceReducer();
    },

    restructureState(state) {
      if (isLiftedUp) {
        return memorizedRestructureState(state);
      }

      return state;
    },

    register(serviceName, eventCreatorByName) {
      if (typeof actionCreatorByService[serviceName] === 'undefined') {
        eventCreatorByType = Object.assign(
          eventCreatorByType,
          mapKeys(eventCreatorByName, name => `${serviceName}/${name}`),
        );
        actionCreatorByService[serviceName] = mapValues(eventCreatorByName, (_, name) =>
          makeActionCreator(`${serviceName}/${name}`),
        );

        replaceReducer();
      }

      return actionCreatorByService[serviceName];
    },

    select(state) {
      if (isLiftedUp) {
        return state[key];
      }

      return state;
    },
  };
}

/**
 * Create a storeEnhancer by apply the registry created
 *
 * @param {*} extraArgument
 */
export default function installRegistry(extraArgument) {
  return createStore => (reducer, preloadedState) => {
    const { original, orchestrated } = resolveState(preloadedState);
    const store = createStore(reducer, original);
    const registry = createRegistry(store, reducer, orchestrated);
    const getStoreState = store.getState;

    return {
      /**
       * Inherit store API
       */
      ...store,

      getState() {
        const storeState = getStoreState();
        const finalState = registry.restructureState(storeState);

        return finalState;
      },

      initialize(service) {
        return service(registry, extraArgument);
      },

      replaceReducer(reducer) {
        registry.replaceReducer(reducer);
      },

      select(state) {
        return registry.select(state);
      },
    };
  };
}
