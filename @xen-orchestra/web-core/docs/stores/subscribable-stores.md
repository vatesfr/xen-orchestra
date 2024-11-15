# Subscribable Stores

Subscribable store is a special kind of store that returns its context only after calling a `subscribe` method.

To create a subscribable store you can use the `createSubscribableStoreContext` helper.

It will take a configuration object as the first argument and an object of dependencies as the second argument.

The configuration object must have the following properties:

- `context`: the store context which will be returned after calling `subscribe`
- `onSubscribe`: a function that will be called when the first client subscribes to the store
- `onUnsubscribe`: a function that will be called when the last client unsubscribes from the store
- `isEnabled`: an optional `MaybeRefOrGetter<boolean>` (default: `true`). If set, `onSubscribe` will be called only if
  the value is `true`

The function will return an object with the following properties:

- `subscribe(options?: { defer: boolean })`: a function which will register a subscription then return the `context`
- `getContext()`: a way to access the `context` object without subscribing (helpful for dependencies)

## Basic store

```ts
export const useBasicStore = defineStore('basic', () => {
  const context = {
    // your store context
  }

  const onSubscribe = async () => {
    // make requests, register polling, update context...
  }

  const onUnsubscribe = () => {
    // cancel current request if any, stop polling...
  }

  const config = {
    context,
    onSubscribe,
    onUnsubscribe,
  }

  return createSubscribableStoreContext(config, {})
})
```

## `isEnabled` configuration

You can use the `isEnabled` property to conditionally enable the subscription to start.

```ts
export const useObjectStore = defineStore('basic', () => {
  const apiStore = useMyApiStore()

  const config = {
    // ...
    isEnabled: () => apiStore.isReady,
  }

  return createSubscribableStoreContext(config, {})
})
```

## Store with dependencies

```ts
export const useGreetingStore = defineStore('greeting', () => {
  const deps = {
    userStore: useUserStore(),
    groupStore: useGroupStore(),
  }

  const userContext = deps.userStore.getContext()
  const groupContext = deps.groupStore.getContext()

  const userGreeting = computed(() => `Hello ${userContext.user.value.name}`)
  const groupGreeting = computed(() => `Hello ${groupContext.group.value.name}`)

  const context = {
    userGreeting,
    groupGreeting,
  }

  const onSubscribe = async () => {
    // make requests, register polling, update context...
  }

  const onUnsubscribe = () => {
    // cancel current request if any, stop polling...
  }

  const config = {
    context,
    onSubscribe,
    onUnsubscribe,
  }

  return createSubscribableStoreContext(config, deps)
})
```

## Accessing the store context

```ts
const { foo, bar } = useFoobarStore().subscribe()
```

## Defer the subscription

```html
<template>
  <button @click="start()">Start subscription</button>
</template>
```

```ts
const { foo, bar, start } = useFoobarStore().subscribe({ defer: true })
```
