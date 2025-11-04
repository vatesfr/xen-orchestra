# `defineRemoteResource` documentation

This utility will create a function that can be used to fetch data from a remote resource (i.e., an API endpoint)

When called, a subscription to the resource is registered.

If multiple Components call that same function, a subscription will be registered for each of them.

They will share the same data and state, which means that the data will be fetched only once and shared across all Components.

The fetch will start automatically when at least one Component is using the resource, then, when the last Component releases the resource, the polling will stop.

The data is cached for a certain duration, so if a Component remounts in the frame time, the data will be retrieved from the cache to be displayed immediately, while the data is being fetched again in the background.

## Basic usage

```typescript
const useMyResource = defineRemoteResource({
  url: '/api/path/to/resource',
})
```

By default, the initial data (`TData`) will be `undefined`, the returned state will be `{ data: Ref<TData> }` and when new data is received, it will just replace the previous one.

```typescript
const { data } = useMyResource()
```

## Initial data, state and received data handling

The initial data, the state and what happen when data is retrieved can be customized by passing the `initialData`, `state` and `onDataReceived` properties:

```typescript
const useMyResource = defineRemoteResource({
  url: '/api/path/to/resource',
  initialData: () => {} as Partial<MyResource>,
  state: (data) => {
    return {
      myResource: data,
      customProp: computed(() => data.foobar)
    }
  },
  onDataReceived: (currentData, receivedData) => {
    deepMerge(currentData.value, receivedData)
  }
}

const { myResource, customProp } = useMyResource()
```

## Context

The context is available in the `$context` property of the returned state.

It contains the following properties:

| Property      | Type                              | Description                                                                        |
| ------------- | --------------------------------- | ---------------------------------------------------------------------------------- |
| `scope`       | `EffectScope`                     | The Vue effect scope used to be shared across the resource and its dependencies    |
| `args`        | `any[]`                           | The arguments passed to the `useMyResource` function                               |
| `isReady`     | `ComputedRef<boolean>`            | Indicates if the resource is ready (i.e., the data has been fetched at least once) |
| `hasError`    | `ComputedRef<boolean>`            | Indicates if an error occurred during the last fetch                               |
| `lastError`   | `ComputedRef<Error \| undefined>` | The last error that occurred during the fetch, if any                              |
| `isEnabled`   | `Ref<boolean>`                    | Whether the resource is enabled (execute the request) or not                       |
| `enable`      | `() => void`                      | Function to manually enable the resource                                           |
| `disable`     | `() => void`                      | Function to manually disable the resource                                          |
| `forceReload` | `() => void`                      | Function to manually reload the resource                                           |

```typescript
const { myResource, $context } = useMyResource()
```

It's also passed as the second argument of the `state` builder and can be used to extend the resource state.

```typescript
const useMyResource = defineRemoteResource({
  url: '/api/path/to/resource',
  state: (data, context) => ({
    myResource: data,
    isMyResourceReady: context.isReady,
  }),
})

const { myResource, isMyResourceReady } = useMyResource()
```

## Dynamic URLs

You can define a dynamic URL by using a function that returns the URL string.

```typescript
const useMyResource = defineRemoteResource({
  url: (id: string) => `/api/path/to/resource/${id}`,
})

const { id } = defineProps<{
  id: string
}>()

const { data } = useMyResource(() => id)
```

## Polling and caching

By default, the resource will poll for updates every 30 seconds and cache the result for 10 seconds.

This can be customized by passing the `pollingIntervalMs` and `cacheDurationMs` properties:

```typescript
const useMyResource = defineRemoteResource({
  url: '/api/path/to/resource',
  pollingIntervalMs: 60_000, // Poll every 60 seconds
  cacheDurationMs: 5 * 60_000, // Cache for 5 minutes
})
```

## Watching a collection

You can enable real-time synchronization with a remote collection by using the `watchCollection` option.
When this option is set, the resource will first fetch the complete dataset once, then listen for any changes on the collection (such as additions, updates, or removals) and automatically update the shared store accordingly.

```typescript
const useMyResource = defineRemoteResource({
  url: '/api/path/to/resource?fields=id,name,status',
  watchCollection: {
    type: 'resource',
    fields: ['id', 'name', 'status'],
  },
  // Optional
  onDataReceived: (currentData, receivedData) => {
    // Called when new or updated data is received
    mergeCollection(currentData.value, receivedData)
  },
  // Optional
  onDataRemoved: (currentData, removedData) => {
    // Called when data is removed from the collection
    removeFromCollection(currentData.value, removedData)
  },
})
```

When a collection is being watched:

- The initial fetch retrieves the entire dataset.
- Any subsequent changes (additions, updates, deletions) are automatically reflected in the resource’s data.
- You can customize how incoming or removed data is handled using the onDataReceived and onDataRemoved callbacks.
- The subscription to collection changes automatically stops when there are no more active component subscribers.
