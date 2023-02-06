export function ceilDiv(a, b) {
  return (a + (b - 1n)) / b
}

export function min(a, b) {
  return a > b ? b : a
}

export function max(a, b) {
  return a > b ? a : b
}

export function sqrt(value) {
  if (value < 0n) {
    throw 'square root of negative numbers is not supported'
  }

  if (value < 2n) {
    return value
  }

  function newtonIteration(n, x0) {
    const x1 = (n / x0 + x0) >> 1n
    if (x0 === x1 || x0 === x1 - 1n) {
      return x0
    }
    return newtonIteration(n, x1)
  }

  return newtonIteration(value, 1n)
}
