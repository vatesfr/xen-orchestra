# `useXoCollectionState` documentation

This composable is used to manage the state of a collection of resources in Xen Orchestra, such as VMs, hosts, etc.

It is meant to be used in conjunction with the `defineRemoteResource` utility from the Web Core library.

```typescript
const useVmCollection = defineRemoteResource({
  url: /path/to/vms',
  initialData: () => [] as XoVm[],
  state: (data, context) => useXoCollectionState(data, { context, baseName: 'vm' }),
})
```

## Arguments

| Name              | Type                   | Description                                                           |
| ----------------- | ---------------------- | --------------------------------------------------------------------- |
| `collection`      | `Ref<XoRecord[]>`      | The XO record collection                                              |
| `config.context`  | `ResourceContext`      | The context for the resource                                          |
| `config.baseName` | `string \| NameConfig` | The base name for the resource, used to generate the state properties |

# Returns

When using a `string` as `baseName`, the following properties will be generated:

| Name                        | Type                                                                                        | Description                                                |
| --------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `<name>s`                   | `Ref<XoRecord[]>`                                                                           | The collection of records                                  |
| `get<Name>ById`             | `(id: XoRecord['id'] \| undefined) => XoRecord \| undefined`                                | Function to get a record by its ID                         |
| `useGet<Name>ById`          | `(id: MaybeRefOrGetter<XoRecord['id']> \| undefined) => ComputedRef<XoRecord \| undefined>` | Reactive version of `get<Name>ById`                        |
| `get<Name>sByIds`           | `(ids: XoRecord['id'][]) => XoRecord[]`                                                     | Function to get multiple records by their IDs              |
| `useGet<Name>sByIds`        | `(ids: MaybeRefOrGetter<XoRecord['id'][]>) => ComputedRef<XoRecord[]>`                      | Reactive version of `get<Name>sByIds`                      |
| `has<Name>ById`             | `(id: XoRecord['id'] \| undefined) => boolean`                                              | Function to check if a record exists by its ID             |
| `useHas<Name>ById`          | `(id: MaybeRefOrGetter<XoRecord['id']> \| undefined) => ComputedRef<boolean>`               | Reactive version of `has<Name>ById`                        |
| `is<Name>CollectionReady`   | `ComputedRef<boolean>`                                                                      | Whether the collection is ready                            |
| `has<Name>CollectionError`  | `ComputedRef<boolean>`                                                                      | Whether there was an error fetching the collection         |
| `last<Name>CollectionError` | `ComputedRef<Error \| undefined>`                                                           | The last error that occurred while fetching the collection |

## Example

```typescript
const {
  vms,
  getVmById,
  useGetVmById,
  getVmsByIds,
  useGetVmsByIds,
  hasVmById,
  useHasVmById,
  isVmCollectionReady,
  hasVmCollectionError,
  lastVmCollectionError,
} = useXoCollectionState(vms, {
  context,
  baseName: 'vm',
})
```

### Using string tuple as `baseName` to handle irregular plural

```typescript
const {
  proxies,
  getProxyById,
  useGetProxyById,
  getProxiesByIds,
  useGetProxiesByIds,
  hasProxyById,
  useHasProxyById,
  isProxyCollectionReady,
  hasProxyCollectionError,
  lastProxyCollectionError,
} = useXoCollectionState(proxies, {
  context,
  baseName: ['proxy', 'proxies'],
})
```
