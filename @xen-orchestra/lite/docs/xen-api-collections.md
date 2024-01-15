<!-- TOC -->

- [XenApiCollection](#xenapicollection)
  - [Get the collection](#get-the-collection)
  - [Defer the subscription](#defer-the-subscription)
  - [Create a dedicated collection](#create-a-dedicated-collection)
  - [Alter the collection](#alter-the-collection)
  _ [Example 1: Adding props to records](#example-1-adding-props-to-records)
  _ [Example 2: Adding props to the collection](#example-2-adding-props-to-the-collection) \* [Example 3, filtering and sorting the collection](#example-3-filtering-and-sorting-the-collection)
  <!-- TOC -->

# XenApiCollection

## Get the collection

To retrieve a collection, invoke `useXenApiCollection("VM")`.

By doing this, the current component will be automatically subscribed to the collection and will be updated when the
collection changes.

When the component is unmounted, the subscription will be automatically stopped.

## Defer the subscription

If you don't want to fetch the data of the collection when the component is mounted, you can pass `{ immediate: false }`
as options: `const { start, isStarted } = useXenApiCollection("VM", { immediate: false })`.

Then you subscribe to the collection by calling `start()`.

## Create a dedicated collection

It is recommended to create a dedicated collection composable for each type of record you want to use.

They are stored in `src/composables/xen-api-collection/*-collection.composable.ts`.

```typescript
// src/composables/xen-api-collection/console-collection.composable.ts

export const useConsoleCollection = () => useXenApiCollection('console')
```

If you want to allow the user to defer the subscription, you can propagate the options to `useXenApiCollection`.

```typescript
// console-collection.composable.ts

export const useConsoleCollection = <Immediate extends boolean = true>(options?: { immediate?: Immediate }) =>
  useXenApiCollection('console', options)
```

```typescript
// MyComponent.vue

const collection = useConsoleCollection({ immediate: false })

setTimeout(() => collection.start(), 10000)
```

## Alter the collection

You can alter the collection by overriding parts of it.

### Example 1: Adding props to records

```typescript
// xen-api.ts

export interface XenApiConsole extends XenApiRecord<'console'> {
  // ... existing props
  someProp: string
  someOtherProp: number
}
```

```typescript
// console-collection.composable.ts

export const useConsoleCollection = () => {
  const collection = useXenApiCollection('console')

  const records = computed(() => {
    return collection.records.value.map(console => ({
      ...console,
      someProp: 'Some value',
      someOtherProp: 42,
    }))
  })

  return {
    ...collection,
    records,
  }
}
```

```typescript
const consoleCollection = useConsoleCollection()

consoleCollection.getByUuid('...').someProp // "Some value"
```

### Example 2: Adding props to the collection

```typescript
// vm-collection.composable.ts

export const useVmCollection = () => {
  const collection = useXenApiCollection('VM')

  return {
    ...collection,
    runningVms: computed(() => collection.records.value.filter(vm => vm.power_state === POWER_STATE.RUNNING)),
  }
}
```

### Example 3, filtering and sorting the collection

```typescript
// vm-collection.composable.ts

export const useVmCollection = () => {
  const collection = useXenApiCollection('VM')

  return {
    ...collection,
    records: computed(() =>
      collection.records.value
        .filter(vm => !vm.is_a_snapshot && !vm.is_a_template && !vm.is_control_domain)
        .sort((vm1, vm2) => vm1.name_label.localeCompare(vm2.name_label))
    ),
  }
}
```
