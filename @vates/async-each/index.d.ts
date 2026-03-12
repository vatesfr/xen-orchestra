export interface AsyncEachOptions {
  concurrency?: number
  signal?: AbortSignal
  stopOnError?: boolean
}

export function asyncEach<Item>(
  iterable: Iterable<Item> | AsyncIterable<Item>,
  iteratee: (item: Item, index: number, iterable: Iterable<Item> | AsyncIterable<Item>) => unknown,
  options?: AsyncEachOptions
): Promise<void>
