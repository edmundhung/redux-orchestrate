export function strictEqualityCheck(prev, next) {
  return prev === next;
}

export function compareArguments(length, prev, next, isEqual) {
  if (!prev) {
    return false;
  }

  for (let i = 0; i < length; i++) {
    if (!isEqual(prev[i], next[i])) {
      return false;
    }
  }

  return true;
}

export default function memorize(func, equalityCheck = strictEqualityCheck) {
  let length = func.length;
  let lastArgs;
  let lastResult;

  return function() {
    const nextArgs = arguments;

    if (!compareArguments(length, lastArgs, nextArgs, equalityCheck)) {
      lastResult = func.apply(null, nextArgs);
    }

    lastArgs = nextArgs;

    return lastResult;
  };
}
