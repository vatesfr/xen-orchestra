declare module 'app-conf' {
  function load(name: string, opts?: { appDir?: string; ignoreUnknownFormats?: boolean }): Promise<any>
  export { load }
}

declare module '@vates/async-each' {
  function asyncEach<Item>(
    iterable: Iterable<Item> | AsyncIterable<Item>,
    iteratee: (item: Item, index: number, iterable: Iterable<Item> | AsyncIterable<Item>) => Promise<void>,
    opts?: { concurrency?: number; signal?: AbortSignal; stopOnError?: boolean }
  ): Promise<void>
  export { asyncEach }
}
