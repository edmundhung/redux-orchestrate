import React from 'react';
import { createStore } from 'redux';
import { defaultReducer, installRegistry } from '@redux-orchestrate/core';
import { render, cleanup } from 'react-testing-library';
import { Provider } from '../src';

describe('Provider', () => {
  let consoleWarn = console.warn;
  let consoleError = console.error;

  beforeEach(() => {
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    cleanup();
  });

  afterAll(() => {
    console.warn = consoleWarn;
    console.error = consoleError;
  });

  it('does not throw', () => {
    const store = createStore(defaultReducer, installRegistry());

    expect(() =>
      render(
        <Provider>
          <div />
        </Provider>,
      ),
    ).not.toThrow();
    expect(() =>
      render(
        <Provider store={store}>
          <div />
        </Provider>,
      ),
    ).not.toThrow();
  });

  it('warns if you provide a store without applying the registry', () => {
    const store = createStore(defaultReducer);

    expect(console.warn).not.toBeCalled();
    render(
      <Provider store={store}>
        <div />
      </Provider>,
    );
    expect(console.warn).toBeCalled();
  });
});
