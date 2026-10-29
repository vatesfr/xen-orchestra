const wrapCall = <Item, Result, This>(
  fn: (this: This, arg: Item) => Result | PromiseLike<Result>,
  arg: Item,
  thisArg: This
): Promise<Awaited<Result>> => {
  try {
    return Promise.resolve(fn.call(thisArg, arg))
  } catch (error) {
    return Promise.reject(error)
  }
}

/**
 * Similar to Promise.all + Array#map but supports all iterables and does not trigger ESLint array-callback-return
 *
 * WARNING: Does not handle plain objects
 *
 * WARNING: unlike `asyncMapSettled`, `mapFn` is called by `Array.from` and
 * therefore also receives the index, and a synchronous throw propagates
 * synchronously instead of rejecting the returned promise
 *
 * @param thisArg defaults to `iterable`
 */
export function asyncMap<Item, Result, This = Iterable<Item>>(
  iterable: Iterable<Item>,
  mapFn: (this: This, item: Item, index: number) => Result | PromiseLike<Result>,
  thisArg?: This
): Promise<Awaited<Result>[]> {
  return Promise.all(Array.from(iterable, mapFn, thisArg === undefined ? iterable : thisArg))
}

/**
 * Like `asyncMap` but wait for all promises to settle before rejecting
 *
 * @param thisArg defaults to `iterable`
 */
export function asyncMapSettled<Item, Result, This = Iterable<Item>>(
  iterable: Iterable<Item>,
  mapFn: (this: This, item: Item) => Result | PromiseLike<Result>,
  thisArg?: This
): Promise<Awaited<Result>[]> {
  const self = (thisArg === undefined ? iterable : thisArg) as This

  return new Promise<Awaited<Result>[]>((resolve, reject) => {
    const onError = (e: unknown) => {
      if (result !== undefined) {
        error = e
        result = undefined
      }
      if (--n === 0) {
        reject(error)
      }
    }
    const onValue = (i: number, value: Awaited<Result>) => {
      // snapshot: `result` cannot change between here and the end of this
      // callback, which lets TypeScript narrow it
      const current = result
      if (current !== undefined) {
        current[i] = value
      }
      if (--n === 0) {
        if (current === undefined) {
          reject(error)
        } else {
          resolve(current)
        }
      }
    }

    let n = 0
    for (const item of iterable) {
      const i = n++
      wrapCall(mapFn, item, self).then(value => onValue(i, value), onError)
    }

    if (n === 0) {
      return resolve([])
    }

    let error: unknown
    let result: Awaited<Result>[] | undefined = new Array(n)
  })
}
