import React from 'react';
import { Provider } from 'react-redux';
import { memorize } from '@redux-orchestrate/core';

function providerFactory(key) {
  const wrapDispatch = memorize(store => {
    if (typeof store.initialize !== 'function' || typeof store.select !== 'function') {
      console.warn('You have to apply the registry to your store before using redux-orchestrate');
      return store;
    }

    const api = {
      initialize: store.initialize,
      select: store.select,
    };

    return {
      ...store,
      dispatch: Object.assign(store.dispatch, {
        [key]: api,
      }),
    };
  });

  const wrapStore = memorize(props => {
    if (!props.store) {
      return props;
    }

    return {
      ...props,
      store: wrapDispatch(props.store),
    };
  });

  function OrchestratedProvider(props) {
    return React.createElement(Provider, wrapStore(props));
  }

  return OrchestratedProvider;
}

export default providerFactory;
