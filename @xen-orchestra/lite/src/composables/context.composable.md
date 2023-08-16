<!-- TOC -->

- [Context Composable](#context-composable)
  - [Usage](#usage)
    - [1. Create the context](#1-create-the-context)
    - [2. Access the context](#2-access-the-context)
    - [3. Update the context](#3-update-the-context)
  - [Context Color](#context-color)
  - [Caveats (boolean props)](#caveats-boolean-props)
  <!-- TOC -->

# Context Composable

This composable allows to access and update a context which will be accessible from a component and all of its children,
regardless of their nesting depth.

## Usage

### 1. Create the context

```ts
// context.ts

const FoobarContext = createContext("default value");
```

### 2. Access the context

You can access the value in any component at any depth:

```ts
// Component.vue

const foobar = useContext(FoobarContext);

console.log(foobar.value); // 'default value'
```

### 3. Update the context

You can pass a `MaybeRefOrGetter` as second argument to update the context value.

```ts
// MyComponent.vue

const props = defineProps<{
  foobar?: string;
}>();

const foobar = useContext(FooBarContext, () => props.foobar);

// With <MyComponent />
console.log(foobar.value); // 'default value'

// With <MyComponent foobar="new value" />
console.log(foobar.value); // 'new value'
```

```ts
// AnyDepthChild.vue

const foobar = useContext(FoobarContext);

// With  <MyComponent />
console.log(foobar.value); // 'default value'

// With <MyComponent foobar="new value" />
console.log(foobar.value); // 'new value'
```

## Context Color

For the specific case of the color context, you can use the `useColorContext` composable (see doc).

## Caveats (boolean props)

When working with `boolean` props, there's an important caveat to be aware of.

If the `MaybeRefOrGetter` returns any other value than `undefined`, the context will be updated according to this value.

This could be problematic if the value comes from a `boolean` prop.

```ts
const props = defineProps<{
  disabled?: boolean;
}>();

useContext(MyBooleanContext, () => props.disabled);
```

In that case, Vue will automatically set the default value for `disabled` prop to `false`.

Even if the `disabled` prop in not provided at all, the current context will not be used and will be replaced
by `false`.

To circumvent this issue, you need to use `withDefaults` and specifically set the default value for `boolean` props
to `undefined`:

```ts
const props = withDefaults(
  defineProps<{
    disabled?: boolean;
  }>(),
  { disabled: undefined }
);

useContext(MyBooleanContext, () => props.disabled);
```
