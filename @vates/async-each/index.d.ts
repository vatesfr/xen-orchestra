export function asyncEach<Item>(
  iterable: Iterable<Item> | AsyncIterable<Item>,
  iteratee: (item: Item, index: number, iterable: Iterable<Item> | AsyncIterable<Item>) => Promise<void>,
  opts?: { concurrency?: number; signal?: AbortSignal; stopOnError?: boolean }
): Promise<void>
