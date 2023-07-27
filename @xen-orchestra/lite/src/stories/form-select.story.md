# `options` prop

## Array of strings

```ts
const options = ["Option 1", "Option 2", "Option 3"];
```

## Array of objects

```ts
const options = [
  { label: "Option 1", value: "option1" },
  { label: "Option 2", value: "option2" },
  { label: "Option 3", value: "option3" },
];
```

### Custom properties

When not using `label` and `value` properties, you can change them with `label-key` and `value-key` props.

```ts
const options = [
  { name: "Option 1", id: "option1" },
  { name: "Option 2", id: "option2" },
  { name: "Option 3", id: "option3" },
];
```

```html
<FormSelect :options="options" label-key="name" value-key="id" />
```

## Array of groups

```ts
const options = [
  {
    label: "Group 1",
    options: [
      { label: "Option 1", value: "option1" },
      { label: "Option 2", value: "option2" },
      { label: "Option 3", value: "option3" },
    ],
  },
  {
    label: "Group 2",
    options: [
      { label: "Option 4", value: "option4" },
      { label: "Option 5", value: "option5" },
      { label: "Option 6", value: "option6" },
    ],
  },
];
```

# `object` prop

```ts
const options = [
  { label: "Option 1", value: "option1" },
  { label: "Option 2", value: "option2" },
  { label: "Option 3", value: "option3" },
];
```

By default, when selection "Option 2", the value sent to `v-model` will be `option2`.

If you want to send the whole object, you can use `object` prop.

In this case, the value sent to `v-model` will be `{ label: 'Option 2', value: 'option2' }`.
