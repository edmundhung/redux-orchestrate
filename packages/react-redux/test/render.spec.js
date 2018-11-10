import React from 'react';
import { createStore } from 'redux';
import {
  defaultReducer,
  installRegistry,
  createAggregate,
  createService,
} from '@redux-orchestrate/core';
import { render, cleanup, fireEvent } from 'react-testing-library';
import { Provider, render as renderProps } from '../src';

describe('render', () => {
  let consoleWarn = console.warn;
  let consoleError = console.error;
  let store;
  let counter;

  beforeEach(() => {
    console.warn = jest.fn();
    console.error = jest.fn();
    store = createStore(defaultReducer, installRegistry());
    counter = createAggregate('counter', 0, {
      increment: () => count => count + 1,
      decrement: () => count => count - 1,
    });
  });

  afterEach(() => {
    cleanup();
  });

  afterAll(() => {
    console.warn = consoleWarn;
    console.error = consoleError;
  });

  it('provides state of the aggregate as render props', () => {
    const TestComponent = props => <span data-testid="count">{props.count}</span>;
    const selector = count => ({ count });
    const TestCounter = renderProps(counter, selector);
    const { getByTestId } = render(
      <Provider store={store}>
        <TestCounter component={TestComponent} />
      </Provider>,
    );

    expect(getByTestId('count').textContent).toEqual('0');
  });

  it('provides commands of the aggregate as render props', () => {
    const TestComponent = props => (
      <div>
        <span data-testid="count">{props.count}</span>
        <button type="button" data-testid="+" onClick={props.increment}>
          +
        </button>
        <button type="button" data-testid="-" onClick={props.decrement}>
          -
        </button>
      </div>
    );
    const selector = (count, { increment, decrement }) => ({
      count,
      increment,
      decrement,
    });
    const TestCounter = renderProps(counter, selector);
    const { getByTestId } = render(
      <Provider store={store}>
        <TestCounter render={TestComponent} />
      </Provider>,
    );

    expect(getByTestId('count').textContent).toEqual('0');
    fireEvent.click(getByTestId('+'));
    expect(getByTestId('count').textContent).toEqual('1');
    fireEvent.click(getByTestId('+'));
    expect(getByTestId('count').textContent).toEqual('2');
    fireEvent.click(getByTestId('-'));
    expect(getByTestId('count').textContent).toEqual('1');
  });

  it('accepts props in selector', () => {
    const TestComponent = props => (
      <div>
        <span data-testid="count">
          {props.count}
          {props.unit}
        </span>
        <button type="button" data-testid="+" onClick={props.increment}>
          +
        </button>
        <button type="button" data-testid="-" onClick={props.decrement}>
          -
        </button>
      </div>
    );
    const selector = (count, commands, props) => ({
      count,
      increment() {
        if (count >= props.max) {
          return;
        }
        return commands.increment();
      },
      decrement: commands.decrement,
    });
    const TestCounter = renderProps(counter, selector);
    const { getByTestId } = render(
      <Provider store={store}>
        <TestCounter max={1} unit="m">
          {TestComponent}
        </TestCounter>
      </Provider>,
    );

    expect(getByTestId('count').textContent).toEqual('0m');
    fireEvent.click(getByTestId('+'));
    expect(getByTestId('count').textContent).toEqual('1m');
    fireEvent.click(getByTestId('+'));
    expect(getByTestId('count').textContent).toEqual('1m');
    fireEvent.click(getByTestId('-'));
    expect(getByTestId('count').textContent).toEqual('0m');
  });

  it('passes all props if they are not overrided by the selector', () => {
    const TestComponent = props => (
      <div>
        <span data-testid="count">
          {props.count}({props.multipy}x)
        </span>
        <button type="button" data-testid="+" onClick={props.increment}>
          +
        </button>
        <button type="button" data-testid="-" onClick={props.decrement}>
          -
        </button>
      </div>
    );
    const selector = (count, { increment, decrement }, { multipy }) => ({
      count: multipy ? count * multipy : count,
      increment,
      decrement,
    });
    const TestCounter = renderProps(counter, selector);
    const { getByTestId } = render(
      <Provider store={store}>
        <TestCounter multipy={NaN}>
          {({ count }) => <TestCounter multipy={count > 2 ? count : 0} component={TestComponent} />}
        </TestCounter>
      </Provider>,
    );

    expect(getByTestId('count').textContent).toEqual('0(0x)');
    fireEvent.click(getByTestId('+'));
    expect(getByTestId('count').textContent).toEqual('1(0x)');
    fireEvent.click(getByTestId('+'));
    expect(getByTestId('count').textContent).toEqual('2(0x)');
    fireEvent.click(getByTestId('+'));
    expect(getByTestId('count').textContent).toEqual('9(3x)');
  });

  it('skips initializing the aggregates and so do not inject state if the provided store has no registry', () => {
    const TestComponent = props => (
      <div>
        <span data-testid="count">{props.count}</span>
        <button type="button" data-testid="+" onClick={props.increment}>
          +
        </button>
        <button type="button" data-testid="-" onClick={props.decrement}>
          -
        </button>
      </div>
    );
    const selector = count => ({ count });
    const TestCounter = renderProps(counter, selector);
    const { getByTestId } = render(
      <Provider store={createStore(defaultReducer)}>
        <TestCounter component={TestComponent} />
      </Provider>,
    );

    expect(getByTestId('count').textContent).toEqual('');
    expect(getByTestId('+')).toBeDefined();
    expect(getByTestId('-')).toBeDefined();
  });

  it('skips render if either component, render and children is not specified', () => {
    const selector = count => ({ count });
    const TestCounter = renderProps(counter, selector);
    const { container } = render(
      <Provider store={store}>
        <TestCounter />
      </Provider>,
    );

    expect(container.innerHTML).toEqual('');
  });
});
