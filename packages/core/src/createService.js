import { bindActionCreators, compose } from 'redux';
import memorize from './memorize';

/**
 * Helper - Applying events one by one
 * Returns an identity function if no events
 *
 * @param {*} events
 */
export function combineEvents(events = []) {
  return compose.apply(null, [].concat(events).reverse());
}

/**
 * Helper - make the `createEvent` helper using the provided selector
 *
 * @param {*} selector
 */
export function makeCreateEvent(selector) {
  return handler => {
    if (typeof handler !== 'function') {
      return combineEvents(handler);
    }

    return state => {
      const model = selector(state);
      const events = handler(model);
      const event = combineEvents(events);

      return event(state);
    };
  };
}

/**
 * Creates a service of a certain context
 *
 * @param {*} name
 * @param {*} dependencies
 * @param {*} selectorFactory
 * @param {*} eventCreatorFactory
 * @param {*} sideEffectFactory
 * @param {*} onInitialize
 */
export default function createService(
  name,
  dependencies,
  modelFactory,
  eventCreatorFactory,
  sideEffectFactory,
  onInitialize,
) {
  function makeSelector(containers) {
    const memorizedModelFactory = memorize(modelFactory);
    const selector = state => {
      const baseModels = containers.map(container => container.readModel(state));
      const model = memorizedModelFactory(...baseModels);

      return model;
    };

    return memorize(selector);
  }

  function makeEventCreators(containers) {
    const baseEventCreators = containers.map(container => container.getEventCreators());

    if (typeof eventCreatorFactory !== 'function') {
      return baseEventCreators.length === 1 ? baseEventCreators[0] : {};
    }

    return eventCreatorFactory(...baseEventCreators);
  }

  function makeSideEffects(containers) {
    const baseSideEffects = containers.map(container => container.getSideEffects());

    if (typeof sideEffectFactory !== 'function') {
      return baseSideEffects.length === 1 ? baseSideEffects[0] : {};
    }

    return sideEffectFactory(...baseSideEffects);
  }

  function service(registry, extraArgument) {
    const containers = []
      .concat(dependencies)
      .map(dependency => dependency(registry, extraArgument));

    let selector = makeSelector(containers);
    let eventCreators = makeEventCreators(containers);

    if (typeof eventCreators === 'function') {
      eventCreators = compose(
        eventCreators,
        makeCreateEvent,
      )(selector);
    }

    let actionCreators = registry.register(`service/${name}`, eventCreators);
    let sideEffects = makeSideEffects(containers);

    if (typeof sideEffects === 'function') {
      sideEffects = sideEffects(selector, actionCreators);
    }

    if (typeof onInitialize === 'function') {
      actionCreators =
        onInitialize(selector, actionCreators, sideEffects, extraArgument) || actionCreators;
    }

    return {
      readModel(state) {
        return selector(state);
      },

      makeCommands(dispatch) {
        return bindActionCreators(actionCreators, dispatch);
      },

      getEventCreators() {
        return { ...eventCreators };
      },

      getSideEffects() {
        return { ...sideEffects };
      },
    };
  }

  return Object.assign(memorize(service), { displayName: name });
}
