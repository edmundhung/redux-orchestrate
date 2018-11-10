import { createAggregate } from '../../src';

function createCounterAggregate(name = 'counter', initialCount = 0, handler = i => i) {
  return createAggregate(
    name,
    initialCount,
    handler({
      increment: (step = 1) => count => count + step,
      decrement: (step = 1) => count => count - step,
    }),
  );
}

export { createCounterAggregate };
