import { bindActionCreators } from 'redux';
import memorize from './memorize';

/**
 * Creates an aggreate of a certain domain
 *
 * @param {*} name
 * @param {*} initialState
 * @param {*} eventCreatorByName
 */
export default function createAggregate(name, initialState, eventCreatorByName) {
  function aggregate(registry) {
    const { readModel, eventCreators } = registry.initialize(
      name,
      initialState,
      eventCreatorByName,
    );
    const actionCreators = registry.register(`aggregate/${name}`, eventCreators);

    return {
      readModel(state) {
        return readModel(state);
      },

      makeCommands(dispatch) {
        return bindActionCreators(actionCreators, dispatch);
      },

      getEventCreators() {
        return { ...eventCreators };
      },

      getSideEffects() {
        return {};
      },
    };
  }

  return Object.assign(memorize(aggregate), { displayName: name });
}
