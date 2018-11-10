import { connectAdvanced } from 'react-redux';
import { compose } from 'redux';
import { memorize } from '@redux-orchestrate/core';
import shallowEqual from './shallowEqual';

function adapterFactory(methodName, key) {
  function makeSelectorFactory(service, selector) {
    const makeMemorizedSelector = (readModel, commands) => {
      const getRenderProps =
        selector.length === 3 ? memorize(props => props, shallowEqual) : props => props;
      const memorizedSelector = memorize(selector);
      const memorizedMergeProps = memorize((state, props) => Object.assign({}, props, state));

      return memorize((state, props) => {
        const model = readModel(state);
        const renderProps = getRenderProps(props);
        const resultState = memorizedSelector(model, commands, renderProps);
        const resultProps = memorizedMergeProps(resultState, renderProps);

        return resultProps;
      });
    };

    return dispatch => {
      const api = dispatch[key];

      if (!api) {
        return (_, props) => props;
      }

      const { initialize, select } = api;
      const container = initialize(service);
      const readModel = compose(
        container.readModel,
        select,
      );
      const commands = container.makeCommands(dispatch);

      return makeMemorizedSelector(readModel, commands);
    };
  }

  return (service, selector) => {
    const selectorFactory = makeSelectorFactory(service, selector);
    const factoryOptions = {
      getDisplayName: name => `${service.displayName}(${name})`,
      methodName: `${methodName}(${service.displayName})`,
    };

    return connectAdvanced(selectorFactory, factoryOptions);
  };
}

export default adapterFactory;
