# Stores for XenApiRecord collections

All collections of `XenApiRecord` are stored inside the `xapiCollectionStore`.

To retrieve a collection, invoke `useXapiCollectionStore().get(type)`.

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

For that, you can use the `createSubscribe<RawObjectType, Extensions>((options) => { /* ... */})` helper.

### Define the extensions

Subscription extensions are defined as `(object | [object, RequiredOptions])[]`.

When using a tuple (`[object, RequiredOptions]`), the corresponding `object` type will be added to the subscription if
the `RequiredOptions` for that tuple are present in the options passed to `subscribe`.

```typescript
// Always present extension
type DefaultExtension = {
  propA: string;
  propB: ComputedRef<number>;
};

// Conditional extension 1
type FirstConditionalExtension = [
  { propC: ComputedRef<string> }, // <- This signature will be added
  { optC: string } // <- if this condition is met
];

// Conditional extension 2
type SecondConditionalExtension = [
  { propD: () => void }, // <- This signature will be added
  { optD: number } // <- if this condition is met
];

// Create the extensions array
type Extensions = [
  DefaultExtension,
  FirstConditionalExtension,
  SecondConditionalExtension
];
```

### Define the subscription

```typescript
export const useConsoleStore = defineStore("console", () => {
  const consoleCollection = useXapiCollectionStore().get("console");

  const subscribe = createSubscribe<"console", Extensions>((options) => {
    const originalSubscription = consoleCollection.subscribe(options);

    const extendedSubscription = {
      propA: "Some string",
      propB: computed(() => 42),
    };

    const propCSubscription = options?.optC !== undefined && {
      propC: computed(() => "Some other string"),
    };

    const propDSubscription = options?.optD !== undefined && {
      propD: () => console.log("Hello"),
    };

    return {
      ...originalSubscription,
      ...extendedSubscription,
      ...propCSubscription,
      ...propDSubscription,
    };
  });

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

In each case, all the default properties (`records`, `getByUuid`, etc.) will be present.

```typescript
const store = useConsoleStore();

// No options (propA and propB will be present)
const subscription = store.subscribe();

// optC option (propA, propB and propC will be present)
const subscription = store.subscribe({ optC: "Hello" });

// optD option (propA, propB and propD will be present)
const subscription = store.subscribe({ optD: 12 });

// optC and optD options (propA, propB, propC and propD will be present)
const subscription = store.subscribe({ optC: "Hello", optD: 12 });
```
