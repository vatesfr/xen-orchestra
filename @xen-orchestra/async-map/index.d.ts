export function asyncMap<Item, This>(iterable: Iterable<Item>, mapFn: (this: This, item: Item) => Item | PromiseLike<Item>, thisArg?: This): Promise<Item[]>;
export function asyncMapSettled<Item, This>(iterable: Iterable<Item>, mapFn: (this: This, item: Item) => Item | PromiseLike<Item>, thisArg?: This): Promise<Item[]>;
