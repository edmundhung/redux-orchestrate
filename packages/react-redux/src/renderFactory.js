import React from 'react';
import { compose } from 'redux';
import adapterFactory from './adapterFactory';

function renderFactory(key) {
  function Render({ component, render, children, ...restProps }) {
    if (component) {
      return React.createElement(component, restProps, children);
    }

    if (typeof render === 'function') {
      return render(restProps);
    }

    if (typeof children === 'function') {
      return children(restProps);
    }

    return null;
  }

  Render.displayName = 'Render';

  return compose(
    connect => connect(Render),
    adapterFactory('render', key),
  );
}

export default renderFactory;
