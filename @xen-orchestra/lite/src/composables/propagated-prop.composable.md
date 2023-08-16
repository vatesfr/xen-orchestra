<!-- TOC -->

- [Propagated Props](#propagated-props)
  - [Usage](#usage)
    - [1. Create the injection key:](#1-create-the-injection-key)
    - [2. Set the initial value in the root component](#2-set-the-initial-value-in-the-root-component)
    - [3. Access the value](#3-access-the-value)
    - [4. Update the value](#4-update-the-value)
  - [Defined propagated props](#defined-propagated-props)
  - [There is currently some predefined propagated props:](#there-is-currently-some-predefined-propagated-props)
  - [IK_PROPAGATED_COLOR](#ikpropagatedcolor)
  - [Caveats (boolean props)](#caveats-boolean-props)
  <!-- TOC -->

# Propagated Props

This composable enables the propagation of a prop to child components, regardless of their nesting depth.

As the prop passes down the component chain, any component can modify its value, which will then be reflected in all its
downstream children.

## Usage

### 1. Create the injection key:

```ts
// injection-keys.ts

const IK_PROPAGATED_FOOBAR = Symbol() as InjectionKey<ComputedRef<string>>;
```

### 2. Set the initial value in the root component

```ts
// App.vue

usePropagatedProp(IK_MY_INJECTION_KEY, "initial value");
```

### 3. Access the value

You can access the value in any child component at any depth:

```ts
// Child.vue

const foobar = usePropagatedProp(IK_PROPAGATED_FOOBAR);

console.log(foobar.value); // 'initial value'
```

### 4. Update the value

By adding a getter as second argument, you can change the value for the current component and all its children:

```ts
// Child.vue

const props = defineProps<{
  foobar?: string;
}>();

const foobar = usePropagatedProp(
  IK_PROPAGATED_FOOBAR,
  () => () => props.foobar
);

// With <Child />
console.log(foobar.value); // 'initial value'

// With <Child foobar="new value" />
console.log(foobar.value); // 'new value'
```

```ts
// SubChild.vue

const foobar = usePropagatedProp(IK_PROPAGATED_FOOBAR);

// With parent <Child />
console.log(foobar.value); // 'initial value'

// With parent <Child foobar="new value" />
console.log(foobar.value); // 'new value'
```

## Propagated color

For the specific case of a color prop, you can use the `usePropagatedColor` composable (see doc).

## Caveats (boolean props)

If the getter returns any other value than `undefined`, the propagated prop will be set to that value.

This will cause an issue if the prop is of type `boolean` because Vue will set its default value to `false`.

It will then break the chain.

To circumvent this issue, you need to use `withDefaults` and specifically set the default value to `undefined`:

```ts
// Child.vue

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
  }>(),
  {
    disabled: undefined,
  }
);
```
