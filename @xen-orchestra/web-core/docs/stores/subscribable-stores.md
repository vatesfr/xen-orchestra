# Subscribable Stores

To create subscribable stores (a special kind of store that returns its context only after calling a `subscribe` method)
you can use the `createSubscribableStoreContext` function.

It will take a configuration object as the first argument and an object of dependencies as the second argument.

The configuration object must have the following properties:

- `context`: the store context which will be returned after calling `subscribe`
- `onSubscribe`: a function that will be called when the first client subscribes to the store
- `onUnsubscribe`: a function that will be called when the last client unsubscribes from the store
- `isEnabled`: an optional `MaybeRefOrGetter<boolean>` (default: `true`). If set, `onSubscribe` will be called only if the value
  is `true`

The function will return an object with the following properties:

- `subscribe(options?: { defer: boolean })`: a function which will register a subscription and return the `context`
- `$context`: to access the `context` object without subscribing

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

  return createSubscribableStoreContext(config, [])
})
```

## Store with dependencies

```ts
export const useUserStore = defineStore('user', () => {
  const context = {
    user: ref(),
  }

  const onSubscribe = async () => {
    context.user.value = await loadUser()
  }

  const onUnsubscribe = () => {
    // cleanup
  }

  const config = {
    context,
    onSubscribe,
    onUnsubscribe,
  }

  return createSubscribableStoreContext(config, {})
})
```

```ts
export const useGreetingStore = defineStore('greeting', () => {
  const deps = {
    userStore: useUserStore(),
  }

  const greeting = ref('Hello')
  const userGreeting = computed(() => `${greeting.value} ${deps.userStore.$context.user.value.name}`)

  const context = {
    greeting,
    userGreeting,
  }

  const onSubscribe = async () => {
    greeting.value = await loadGreeting()
  }

  const config = {
    context,
    onSubscribe: async () => {
      this.context.records.value = await loadData()
    },
    onUnsubscribe: () => {
      // cleanup
    },
  }

  return createSubscribableStoreContext(config, [useFirstStore])
})
```
