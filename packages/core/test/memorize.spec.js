import { memorize } from '../src';

describe('memorize', () => {
  it('wraps the function and stop recompute until received new arguments', () => {
    function add10Implementation(num) {
      return num + 10;
    }

    const add10 = jest.fn(add10Implementation);
    const memorizedAdd10 = memorize(add10);

    expect(memorizedAdd10(0)).toEqual(10);
    expect(add10).toBeCalledTimes(1);
    expect(memorizedAdd10(0)).toEqual(10);
    expect(add10).toBeCalledTimes(1);
    expect(memorizedAdd10(-10)).toEqual(0);
    expect(add10).toBeCalledTimes(2);
  });

  it('monitors arguments specify in the function signature only', () => {
    function maxImplementation(a, b) {
      return Math.max.apply(null, [a, b, ...arguments]);
    }

    const max = jest.fn(maxImplementation);
    const memorizedMax = memorize(max);

    expect(memorizedMax(1, 2, 3)).toEqual(3);
    expect(max).toBeCalledTimes(1);
    expect(memorizedMax(1, 2, 1)).toEqual(3);
    expect(max).toBeCalledTimes(1);
    expect(memorizedMax(1, 10, 1)).toEqual(10);
    expect(max).toBeCalledTimes(2);
  });

  it('accepts overriding the default equality check by receivng the 2nd argument', () => {
    function mergeImplementation(a, b) {
      return Object.assign({}, a, b);
    }

    function isNumberOfKeysChanged(prev, next) {
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);

      return !prev || prevKeys.length !== nextKeys.length;
    }

    const merge = jest.fn(mergeImplementation);
    const memorizedMerge = memorize(merge);
    const overridedMemorizedMerge = memorize(merge, isNumberOfKeysChanged);

    const obj1 = { a: 1, b: 2, c: 3 };
    const obj2 = { x: 9, y: 8, z: 7 };

    expect(overridedMemorizedMerge(obj1, obj2)).toEqual(memorizedMerge(obj1, obj2));
    obj1.new = 'test';
    expect(overridedMemorizedMerge(obj1, obj2)).not.toEqual(memorizedMerge(obj1, obj2));
  });
});
