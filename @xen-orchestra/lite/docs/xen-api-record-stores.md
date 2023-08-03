# Stores for XenApiRecord collections

All collections of `XenApiRecord` are stored inside the `xapiCollectionStore`.

To retrieve a collection, invoke `useXapiCollectionStore().get(type)`.

## TL;DR - How to extend a subscription

_**Note:** Once the extension grows in complexity, it's recommended to create a dedicated file for it (e.g. `host.extension.ts` for `host.store.ts`)._

```typescript
type MyExtension1 = Extension<{ propA: string }>;

type MyExtension2 = Extension<{ propB: string }, { withB: true }>;

type Extensions = [
  XenApiRecordExtension<XenApiHost>, // If needed
  DeferExtension, // If needed
  MyExtension1,
  MyExtension2
];

export const useHostStore = defineStore("host", () => {
  const hostCollection = useXapiCollectionStore().get("console");

  const subscribe = <O extends Options<Extensions>>(options?: O) => {
    const originalSubscription = hostCollection.subscribe(options);

    const myExtension1: PartialSubscription<MyExtension1> = {
      propA: "Hello",
    };

    const myExtension2: PartialSubscription<MyExtension2> | undefined =
      options?.withB
        ? {
            propB: "World",
          }
        : undefined;

    return {
      ...originalSubscription,
      ...myExtension1,
      ...myExtension2,
    };
  };

  return {
    ...hostCollection,
    subscribe,
  };
});
```

## Accessing a collection

In order to use a collection, you'll need to subscribe to it.

```typescript
const consoleStore = useXapiCollectionStore().get("console");
const { records, getByUuid /* ... */ } = consoleStore.subscribe();
```

## Deferred subscription

If you wish to initialize the subscription on demand, you can pass `{ immediate: false }` as options to `subscribe()`.

```typescript
const consoleStore = useXapiCollectionStore().get("console");
const { records, start, isStarted /* ... */ } = consoleStore.subscribe({
  immediate: false,
});

// Later, you can then use start() to initialize the subscription.
```

## Create a dedicated store for a collection

To create a dedicated store for a specific `XenApiRecord`, simply return the collection from the XAPI Collection Store:

```typescript
export const useConsoleStore = defineStore("console", () =>
  useXapiCollectionStore().get("console")
);
```

## Extending the base Subscription

To extend the base Subscription, you'll need to override the `subscribe` method.

### Define the extensions

Subscription extensions are defined as a simple extension (`Extension<object>`) or as a conditional
extension (`Extension<object, object>`).

When using a conditional extension, the corresponding `object` type will be added to the subscription only if
the the options passed to `subscribe(options)` do match the second argument or `Extension`.

There is two existing extensions:

- `XenApiRecordExtension<T extends XenApiRecord>`: a simple extension which defined all the base
  properties and methods (`records`, `getByOpaqueRef`, `getByUuid`, etc.)
- `DeferExtension`: a conditional extension which add the `start` and `isStarted` properties if the
  `immediate` option is set to `false`.

```typescript
// Always present extension
type PropABExtension = Extension<{
  propA: string;
  propB: ComputedRef<number>;
}>;

// Conditional extension 1
type PropCExtension = Extension<
  { propC: ComputedRef<string> }, // <- This signature will be added
  { optC: string } // <- if this condition is met
>;

// Conditional extension 2
type PropDExtension = Extension<
  { propD: () => void }, // <- This signature will be added
  { optD: number } // <- if this condition is met
>;

// Create the extensions array
type Extensions = [
  XenApiRecordExtension<XenApiHost>,
  DeferExtension,
  PropABExtension,
  PropCExtension,
  PropDExtension
];
```

### Define the `subscribe` method

You can then create the `subscribe` function with the help of `Options` and `Subscription` helper types.

This will allow to get correct completion and type checking for the `options` argument, and to get the correct return
type based on passed options.

```typescript
const subscribe = <O extends Options<Extensions>>(options?: O) => {
  return {
    // ...
  } as Subscription<Extensions, O>;
};
```

### Extend the subscription

The `PartialSubscription` type will help to define and check the data to add to subscription for each extension.

```typescript
export const useConsoleStore = defineStore("console", () => {
  const consoleCollection = useXapiCollectionStore().get("console");

  const subscribe = <O extends Options<Extensions>>(options?: O) => {
    const originalSubscription = consoleCollection.subscribe(options);

    const propABSubscription: PartialSubscription<PropABExtension> = {
      propA: "Some string",
      propB: computed(() => 42),
    };

    const propCSubscription: PartialSubscription<PropCExtension> | undefined =
      options?.optC !== undefined
        ? {
            propC: computed(() => "Some other string"),
          }
        : undefined;

    const propDSubscription: PartialSubscription<PropDExtension> | undefined =
      options?.optD !== undefined
        ? {
            propD: () => console.log("Hello"),
          }
        : undefined;

    return {
      ...originalSubscription,
      ...propABSubscription,
      ...propCSubscription,
      ...propDSubscription,
    };
  };

  return {
    ...consoleCollection,
    subscribe,
  };
});
```

The generated `subscribe` method will then automatically have the following `options` signature:

```typescript
type Options = {
  immediate?: false;
  optC?: string;
  optD?: number;
};
```

### Use the subscription

```typescript
const store = useConsoleStore();

// No options (Contains common properties: `propA`, `propB`, `records`, `getByUuid`, etc.)
const subscription1 = store.subscribe();

// optC option (Contains common properties + `propC`)
const subscription2 = store.subscribe({ optC: "Hello" });

// optD option (Contains common properties + `propD`)
const subscription3 = store.subscribe({ optD: 12 });

// optC and optD options (Contains common properties + `propC` + `propD`)
const subscription4 = store.subscribe({ optC: "Hello", optD: 12 });
```
