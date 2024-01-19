<!-- TOC -->

- [Overview](#overview)
  - [Simple Context](#simple-context)
    - [1. Create the context](#1-create-the-context)
    - [2. Use the context](#2-use-the-context)
      - [2.1. Read](#21-read)
      - [2.2. Update](#22-update)
  - [Advanced Context](#advanced-context)
    - [1. Create the context](#1-create-the-context-1)
    - [2. Use the context](#2-use-the-context-1)
      - [2.1. Read](#21-read-1)
      - [2.2. Update](#22-update-1)
  - [Caveats (boolean props)](#caveats-boolean-props)
  <!-- TOC -->

# Overview

`createContext` lets you create a context that is both readable and writable, and is accessible by a component and all
its descendants at any depth.

Each descendant has the ability to change the context value, affecting itself and all of its descendants at any level.

## Simple Context

### 1. Create the context

`createContext` takes the initial context value as first argument.

```ts
// context.ts

const CounterContext = createContext(0)
```

### 2. Use the context

#### 2.1. Read

You can get the current Context value by using `useContext(CounterContext)`.

```ts
const counter = useContext(CounterContext)

console.log(counter.value) // 0
```

#### 2.2. Update

You can pass a `MaybeRefOrGetter` as second argument to update the context value.

```ts
// MyComponent.vue

const props = defineProps<{
  counter?: number
}>()

const counter = useContext(CounterContext, () => props.counter)

// When calling <MyComponent />
console.log(counter.value) // 0

// When calling <MyComponent :counter="20" />
console.log(counter.value) // 20
```

## Advanced Context

To customize the context output, you can pass a custom context builder as the second argument of `createContext`.

### 1. Create the context

```ts
// context.ts

// Example 1. Return a object
const CounterContext = createContext(10, counter => ({
  counter,
  isEven: computed(() => counter.value % 2 === 0),
}))

// Example 2. Return a computed value
const DoubleContext = createContext(10, num => computed(() => num.value * 2))
```

### 2. Use the context

#### 2.1. Read

When using the context, it will return your custom value.

```ts
const { counter, isEven } = useContext(CounterContext)
const double = useContext(DoubleContext)

console.log(counter.value) // 10
console.log(isEven.value) // true
console.log(double.value) // 20
```

#### 2.2. Update

Same as with a simple context, you can pass a `MaybeRefOrGetter` as second argument.

```ts
// Parent.vue
useContext(CounterContext, 99)
useContext(DoubleContext, 99)

// Child.vue
const { isEven } = useContext(CounterContext)
const double = useContext(DoubleContext)

console.log(isEven.value) // false
console.log(double.value) // 198
```

## Caveats (boolean props)

When working with `boolean` props, there's an important caveat to be aware of.

If the `MaybeRefOrGetter` returns any other value than `undefined`, the context will be updated according to this value.

This could be problematic if the value comes from a `boolean` prop.

```ts
const props = defineProps<{
  disabled?: boolean
}>()

useContext(MyBooleanContext, () => props.disabled) // Update to `false` if `undefined`
```

In that case, Vue will automatically set the default value for `disabled` prop to `false`.

Even if the `disabled` prop in not provided at all, the current context will not be used and will be replaced
by `false`.

To circumvent this issue, you need to use `withDefaults` and specifically set the default value for `boolean` props
to `undefined`:

```ts
const props = withDefaults(
  defineProps<{
    disabled?: boolean
  }>(),
  { disabled: undefined }
)

useContext(MyBoolean, () => props.disabled) // Keep parent value if `undefined`
```
